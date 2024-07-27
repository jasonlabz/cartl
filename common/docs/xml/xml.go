package xml

import (
	"os"
	"strings"

	"github.com/antchfx/xmlquery"
)

func LoadXMLFromURL(url string) (*xmlquery.Node, error) {
	doc, err := xmlquery.LoadURL(url)
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func LoadXMLFromFilePath(path string) (*xmlquery.Node, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	doc, err := xmlquery.Parse(file)
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func LoadXMLFromString(s string) (*xmlquery.Node, error) {
	index := strings.Index(s, "<")
	if index != -1 {
		s = s[index:]
	}
	doc, err := xmlquery.Parse(strings.NewReader(s))
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func Query(doc *xmlquery.Node, expr string) ([]*xmlquery.Node, error) {
	return xmlquery.QueryAll(doc, expr)
}

func QueryOne(doc *xmlquery.Node, expr string) (*xmlquery.Node, error) {
	return xmlquery.Query(doc, expr)
}
