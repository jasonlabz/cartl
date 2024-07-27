package record

type Record struct {
	Data  map[string]interface{}
	Meta  map[string]interface{}
	Error error
}

type Source interface {
	Extract() (<-chan Record, error)
}

type Transformer interface {
	Transform(<-chan Record) <-chan Record
}

type Loader interface {
	Load(<-chan Record) error
}
