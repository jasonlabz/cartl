package json

import (
	"os"
	"strings"

	"github.com/antchfx/jsonquery"
)

func LoadJSONFromURL(url string) (*jsonquery.Node, error) {
	doc, err := jsonquery.LoadURL(url)
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func LoadJSONFromFilePath(path string) (*jsonquery.Node, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	doc, err := jsonquery.Parse(file)
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func LoadJSONFromString(s string) (*jsonquery.Node, error) {
	doc, err := jsonquery.Parse(strings.NewReader(s))
	if err != nil {
		return nil, err
	}
	return doc, nil
}
