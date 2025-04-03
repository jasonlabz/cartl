package xlsx

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/jasonlabz/cartl/config"
	"github.com/jasonlabz/cartl/element"
)

func Test_WriteRead(t *testing.T) {
	tmpDir := os.TempDir()
	type args struct {
		columns  []element.Column
		inConf   *config.JSON
		outConf  *config.JSON
		filename string
	}
	tests := []struct {
		name    string
		args    args
		wantStr string
	}{
		{
			name: "1",
			args: args{
				columns: []element.Column{
					element.NewDefaultColumn(element.NewStringColumnValueWithEncoder(
						"20220101", element.NewStringTimeEncoder("20060102")), "1", 0),
					element.NewDefaultColumn(element.NewStringColumnValue("abc"),
						"2", 0),
				},
				inConf:   testJSONFromString(`{"sheet":"where","column":[{"index":"A","type":"time","format":"yyyy-MM-dd"}]}`),
				outConf:  testJSONFromString(`{"sheets":["where"],"column":[{"index":"A","type":"time","format":"yyyy-MM-dd"}]}`),
				filename: filepath.Join(tmpDir, "1.xlsx"),
			},
			wantStr: "0=2022-01-01 00:00:00Z 1=abc",
		},
		{
			name: "2",
			args: args{
				columns: []element.Column{
					element.NewDefaultColumn(element.NewStringColumnValueWithEncoder(
						"20220101", element.NewStringTimeEncoder("20060102")), "1", 0),
					element.NewDefaultColumn(element.NewNilStringColumnValue(),
						"2", 0),
				},
				inConf:   testJSONFromString(`{"sheet":"where","nullFormat":"\\N","column":[{"index":"A","type":"time","format":"yyyy-MM-dd"}]}`),
				outConf:  testJSONFromString(`{"sheets":["where"],"nullFormat":"\\N","column":[{"index":"A","type":"time","format":"yyyy-MM-dd"}]}`),
				filename: filepath.Join(tmpDir, "2.xlsx"),
			},
			wantStr: "0=2022-01-01 00:00:00Z 1=<nil>",
		},
		{
			name: "3",
			args: args{
				columns: []element.Column{
					element.NewDefaultColumn(element.NewNilStringColumnValue(), "1", 0),
					element.NewDefaultColumn(element.NewStringColumnValue("abc"),
						"2", 0),
				},
				inConf:   testJSONFromString(`{"sheet":"where","nullFormat":"\\N","column":[{"index":"A","type":"time","format":"yyyy-MM-dd"}]}`),
				outConf:  testJSONFromString(`{"sheets":["where"],"nullFormat":"\\N","column":[{"index":"A","type":"time","format":"yyyy-MM-dd"}]}`),
				filename: filepath.Join(tmpDir, "3.xlsx"),
			},
			wantStr: "0=<nil> 1=abc",
		},
		{
			name: "4",
			args: args{
				columns: []element.Column{
					element.NewDefaultColumn(element.NewNilStringColumnValue(), "1", 0),
					element.NewDefaultColumn(element.NewStringColumnValue("abc"),
						"2", 0),
				},
				inConf:   testJSONFromString(`{"sheet":"where","nullFormat":"\\N","column":[{"index":"A","type":"time","format":"yyyy-MM-dd"}],"startRow":2}`),
				outConf:  testJSONFromString(`{"sheets":["where"],"nullFormat":"\\N","column":[{"index":"A","type":"time","format":"yyyy-MM-dd"}],"hasHeader":true}`),
				filename: filepath.Join(tmpDir, "4.xlsx"),
			},
			wantStr: "0=<nil> 1=abc",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			defer os.Remove(tt.args.filename)
			record := element.NewDefaultRecord()
			for _, c := range tt.args.columns {
				record.Add(c)
			}
			wFunc := func() {
				var creator Creator
				out, err := creator.Create(tt.args.filename)
				if err != nil {
					t.Fatal(err)
				}
				defer out.Close()
				w, err := out.Writer(tt.args.outConf)
				if err != nil {
					t.Fatal(err)
				}
				defer w.Close()
				defer w.Flush()
				if err = w.Write(record); err != nil {
					t.Fatal(err)
				}
			}

			var got []element.Record
			rFunc := func() {
				var opener Opener
				in, err := opener.Open(tt.args.filename)
				if err != nil {
					t.Fatal(err)
				}
				defer in.Close()
				rows, err := in.Rows(tt.args.inConf)
				if err != nil {
					t.Fatal(err)
				}
				defer rows.Close()
				for rows.Next() {
					r := element.NewDefaultRecord()
					cols, err := rows.Scan()
					if err != nil {
						t.Fatal(err)
					}
					if len(cols) > 0 {
						for _, v := range cols {
							r.Add(v)
						}
						got = append(got, r)
					}
				}
				if err = rows.Error(); err != nil {
					t.Fatal(err)
				}
			}
			wFunc()
			rFunc()
			if len(got) != 1 {
				t.Fatal("len is not 1")
			}
			if got[0].String() != tt.wantStr {
				t.Fatalf("got: %v want: %v", got[0].String(), tt.wantStr)
			}
		})
	}
}

func TestWriter_Write(t *testing.T) {
	tmpDir := os.TempDir()
	type args struct {
		records  []element.Record
		outConf  *config.JSON
		filename string
	}
	tests := []struct {
		name    string
		args    args
		wantErr bool
	}{
		{
			name: "1",
			args: args{
				records: []element.Record{
					element.NewDefaultRecord(),
					element.NewDefaultRecord(),
				},
				outConf:  testJSONFromString(`{"sheets":["where","where1"],"sheetRow":1}`),
				filename: filepath.Join(tmpDir, "1.xlsx"),
			},
		},
		{
			name: "2",
			args: args{
				records: []element.Record{
					element.NewDefaultRecord(),
					element.NewDefaultRecord(),
				},
				outConf:  testJSONFromString(`{"sheets":["where"],"sheetRow":1}`),
				filename: filepath.Join(tmpDir, "2.xlsx"),
			},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			defer os.Remove(tt.args.filename)

			var creator Creator
			out, err := creator.Create(tt.args.filename)
			if err != nil {
				t.Fatal(err)
			}
			defer out.Close()
			w, err := out.Writer(tt.args.outConf)
			if err != nil {
				t.Fatal(err)
			}
			defer w.Close()
			defer w.Flush()
			for _, r := range tt.args.records {
				err = w.Write(r)
			}
			if (err != nil) != tt.wantErr {
				t.Errorf("writer.Write() error = %v, wantErr %v", err, tt.wantErr)
			}

		})
	}
}
