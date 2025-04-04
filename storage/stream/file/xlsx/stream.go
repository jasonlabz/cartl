package xlsx

import (
	"fmt"
	"strconv"
	"time"

	"github.com/jasonlabz/cartl/config"
	"github.com/jasonlabz/cartl/element"
	"github.com/jasonlabz/cartl/storage/stream/file"
	"github.com/pingcap/errors"
	"github.com/xuri/excelize/v2"
)

func init() {
	var opener Opener
	file.RegisterOpener("xlsx", &opener)
	var creator Creator
	file.RegisterCreator("xlsx", &creator)
}

// Opener xlsx输入流打开器
type Opener struct {
}

// Open 打开一个名为filename的xlsx输入流
func (o *Opener) Open(filename string) (file.InStream, error) {
	return NewInStream(filename)
}

// Creator xlsx输出流创建器
type Creator struct {
}

// Create 创建一个名为filename的xlsx输出流
func (c *Creator) Create(filename string) (file.OutStream, error) {
	return NewOutStream(filename)
}

// Stream xlsx文件流
type Stream struct {
	file     *excelize.File
	filename string
}

// NewInStream 创建一个名为filename的xlsx输入流
func NewInStream(filename string) (file.InStream, error) {
	stream := &Stream{}
	var err error
	stream.file, err = excelize.OpenFile(filename)
	if err != nil {
		return nil, err
	}
	return stream, nil
}

// NewOutStream 创建一个名为filename的xlsx输出流
func NewOutStream(filename string) (file.OutStream, error) {
	stream := &Stream{
		filename: filename,
	}
	stream.file = excelize.NewFile()
	return stream, nil
}

// Rows 新建一个配置未conf的csv行读取器
func (s *Stream) Rows(conf *config.JSON) (file.Rows, error) {
	return NewRows(s.file, conf)
}

// Writer 新建一个配置未conf的xlsx流写入器
func (s *Stream) Writer(conf *config.JSON) (file.StreamWriter, error) {
	return NewWriter(s.file, conf)
}

// Close 关闭文件流
func (s *Stream) Close() (err error) {
	if s.filename != "" {
		err = s.file.SaveAs(s.filename)
		return
	}
	return s.file.Close()
}

// Rows 行读取器
type Rows struct {
	*excelize.Rows

	row     int
	columns map[int]Column
	config  *InConfig
}

// NewRows 通过文件句柄f，和配置文件c 创建行读取器
func NewRows(f *excelize.File, c *config.JSON) (rows *Rows, err error) {
	var conf *InConfig
	if conf, err = NewInConfig(c); err != nil {
		return
	}
	rows = &Rows{
		columns: make(map[int]Column),
		config:  conf,
	}
	for _, v := range conf.Columns {
		rows.columns[v.index()] = v
	}
	rows.Rows, err = f.Rows(conf.Sheet)
	return
}

// Scan 扫描成列
func (r *Rows) Scan() (columns []element.Column, err error) {
	r.row++
	if r.row < r.config.startRow() {
		return nil, nil
	}

	var record []string
	record, err = r.Columns()
	if err != nil {
		return nil, err
	}

	for i, v := range record {
		var c element.Column
		c, err = r.getColum(i, v)
		if err != nil {
			return nil, err
		}
		columns = append(columns, c)
	}
	return
}

func (r *Rows) getColum(index int, s string) (element.Column, error) {
	byteSize := element.ByteSize(s)
	c, ok := r.columns[index]
	if ok && element.ColumnType(c.Type) == element.TypeTime {
		if s == r.config.NullFormat {
			return element.NewDefaultColumn(element.NewNilTimeColumnValue(),
				strconv.Itoa(index), byteSize), nil
		}
		layout := c.layout()
		t, err := time.Parse(layout, s)
		if err != nil {
			return nil, errors.Wrapf(err, "Parse time fail. layout: %v", layout)
		}
		return element.NewDefaultColumn(element.NewTimeColumnValueWithDecoder(t,
			element.NewStringTimeDecoder(layout)),
			strconv.Itoa(index), byteSize), nil
	}
	if s == r.config.NullFormat {
		return element.NewDefaultColumn(element.NewNilStringColumnValue(),
			strconv.Itoa(index), byteSize), nil
	}
	return element.NewDefaultColumn(element.NewStringColumnValue(s), strconv.Itoa(index), byteSize), nil
}

// Writer xlsx流写入器
type Writer struct {
	file       *excelize.File
	writer     *excelize.StreamWriter
	conf       *OutConfig
	row        int
	sheetIndex int
	columns    map[int]Column
}

// NewWriter 通过文件句柄f，和配置文件c 创建xlsx流写入器
func NewWriter(f *excelize.File, c *config.JSON) (file.StreamWriter, error) {
	w := &Writer{
		file:    f,
		columns: make(map[int]Column),
	}
	var err error
	w.conf, err = NewOutConfig(c)
	if err != nil {
		return nil, err
	}
	for _, v := range w.conf.Columns {
		w.columns[v.index()] = v
	}
	if err = w.newStreamWriter(); err != nil {
		return nil, err
	}
	return w, nil
}

// Write 将记录record 写入xlsx文件
func (w *Writer) Write(record element.Record) (err error) {
	w.row++
	if w.row > w.conf.sheetRow() {
		if err = w.writer.Flush(); err != nil {
			return
		}
		w.row = 1
		w.writer = nil
		if err = w.newStreamWriter(); err != nil {
			return
		}
	}

	if w.row == 1 && w.conf.HasHeader {
		if len(w.conf.Header) == 0 {
			for i := 0; i < record.ColumnNumber(); i++ {
				var col element.Column
				if col, err = record.GetByIndex(i); err != nil {
					return
				}
				w.conf.Header = append(w.conf.Header, col.Name())
			}
		}
		var records []interface{}
		for _, v := range w.conf.Header {
			records = append(records, v)
		}
		axis, _ := excelize.CoordinatesToCellName(1, w.row)
		if err = w.writer.SetRow(axis, records); err != nil {
			return err
		}
		w.row++
	}

	var records []interface{}
	for i := 0; i < record.ColumnNumber(); i++ {
		var col element.Column
		if col, err = record.GetByIndex(i); err != nil {
			return
		}
		var s string
		if s, err = w.getRecord(col, i); err != nil {
			return
		}
		records = append(records, s)
	}
	axis, _ := excelize.CoordinatesToCellName(1, w.row)
	return w.writer.SetRow(axis, records)
}

// Flush 不刷新
func (w *Writer) Flush() (err error) {
	return
}

// Close w.writer有可能为空，刷新文件内存到临时文件
func (w *Writer) Close() (err error) {
	if w.writer != nil {
		err = w.writer.Flush()
	}
	return
}

func (w *Writer) newStreamWriter() (err error) {
	var name string
	name, err = w.getSheetName()
	if err != nil {
		return
	}
	w.file.NewSheet(name)
	w.writer, err = w.file.NewStreamWriter(name)
	if err != nil {
		return
	}
	return
}

func (w *Writer) getRecord(col element.Column, i int) (s string, err error) {
	if col.IsNil() {
		return w.conf.NullFormat, nil
	}
	if c, ok := w.columns[i]; ok && element.ColumnType(c.Type) == element.TypeTime {
		var t time.Time
		if t, err = col.AsTime(); err != nil {
			return
		}
		s = t.Format(c.layout())
		return
	}
	s, err = col.AsString()
	return
}

func (w *Writer) getSheetName() (string, error) {
	if w.sheetIndex < len(w.conf.Sheets) {
		w.sheetIndex++
		return w.conf.Sheets[w.sheetIndex-1], nil
	}
	return "", fmt.Errorf("index out of range in sheets")
}
