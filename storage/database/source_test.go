package database

import (
	"reflect"
	"testing"

	"github.com/jasonlabz/cartl/config"
)

func TestBaseSource_Config(t *testing.T) {
	tests := []struct {
		name string
		b    *BaseSource
		want *config.JSON
	}{
		{
			name: "1",
			b:    NewBaseSource(testJSONFromString(`{}`)),
			want: testJSONFromString(`{}`),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.b.Config(); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("BaseSource.Config() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestNewSource(t *testing.T) {
	registerMock()
	type args struct {
		name string
		conf *config.JSON
	}
	tests := []struct {
		name       string
		args       args
		wantSource Source
		wantErr    bool
	}{
		{
			name: "1",
			args: args{
				name: "mock",
				conf: testJSONFromString("{}"),
			},
			wantSource: &mockSource{
				BaseSource: NewBaseSource(testJSONFromString("{}")),
				name:       "mock",
			},
		},
		{
			name: "2",
			args: args{
				name: "test?",
				conf: testJSONFromString("{}"),
			},
			wantErr: true,
		},
		{
			name: "3",
			args: args{
				name: "mockErr",
				conf: testJSONFromString("{}"),
			},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotSource, err := NewSource(tt.args.name, tt.args.conf)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewSource() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(gotSource, tt.wantSource) {
				t.Errorf("NewSource() = %v, want %v", gotSource, tt.wantSource)
			}
		})
	}
}
