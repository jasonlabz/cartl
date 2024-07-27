package html

import (
	"strings"

	"github.com/antchfx/htmlquery"
	"golang.org/x/net/html"
)

func LoadHTMLFromURL(url string) (*html.Node, error) {
	doc, err := htmlquery.LoadURL(url)
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func LoadHTMLFromFilePath(path string) (*html.Node, error) {
	doc, err := htmlquery.LoadDoc(path)
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func LoadHTMLFromString(s string) (*html.Node, error) {
	index := strings.Index(s, "<")
	if index != -1 {
		s = s[index:]
	}
	doc, err := htmlquery.Parse(strings.NewReader(s))
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func Query(doc *html.Node, expr string) ([]*html.Node, error) {
	return htmlquery.QueryAll(doc, expr)
}

func QueryOne(doc *html.Node, expr string) (*html.Node, error) {
	return htmlquery.Query(doc, expr)
}
