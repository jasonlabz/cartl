package html

import (
	"fmt"
	"github.com/antchfx/htmlquery"
	"testing"
)

func TestTestHTML(t *testing.T) {
	doc, err := htmlquery.LoadURL("http://www.baidu.com/")
	nodes, err := htmlquery.QueryAll(doc, "//a")
	if err != nil {
		panic(`not a valid XPath expression.`)
	}
	fmt.Println(nodes)
}
