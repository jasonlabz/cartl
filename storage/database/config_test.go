package database

import (
	"reflect"
	"testing"
	"time"

	"github.com/Breeze0806/go/time2"
	"github.com/jasonlabz/cartl/config"
)

func TestConfig_GetMaxOpenConns(t *testing.T) {
	tests := []struct {
		name string
		c    *PoolConfig
		want int
	}{
		{
			name: "1",
			c:    &PoolConfig{},
			want: DefaultMaxOpenConns,
		},
		{
			name: "2",
			c: &PoolConfig{
				MaxOpenConns: 10,
			},
			want: 10,
		},
		{
			name: "3",
			c: &PoolConfig{
				MaxOpenConns: -10,
			},
			want: DefaultMaxOpenConns,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.c.GetMaxOpenConns(); got != tt.want {
				t.Errorf("Config.GetMaxOpenConns() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestConfig_GetMaxIdleConns(t *testing.T) {
	tests := []struct {
		name string
		c    *PoolConfig
		want int
	}{
		{
			name: "1",
			c:    &PoolConfig{},
			want: DefaultMaxIdleConns,
		},
		{
			name: "2",
			c: &PoolConfig{
				MaxIdleConns: -10,
			},
			want: DefaultMaxIdleConns,
		},
		{
			name: "3",
			c: &PoolConfig{
				MaxIdleConns: 10,
			},
			want: 10,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.c.GetMaxIdleConns(); got != tt.want {
				t.Errorf("Config.GetMaxIdleConns() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestNewConfig(t *testing.T) {
	type args struct {
		conf *config.JSON
	}
	tests := []struct {
		name    string
		args    args
		wantC   *Config
		wantErr bool
	}{
		{
			name: "1",
			args: args{
				conf: testJSONFromString(`{"pool":{"connMaxIdleTime":"1","connMaxLifetime":"1"}}`),
			},
			wantErr: true,
		},

		{
			name: "2",
			args: args{
				conf: testJSONFromString(`{"pool":{"connMaxIdleTime":"1h","connMaxLifetime":"1h","maxOpenConns":10,"maxIdleConns":10}}`),
			},
			wantC: &Config{
				Pool: PoolConfig{
					MaxOpenConns:    10,
					MaxIdleConns:    10,
					ConnMaxIdleTime: time2.NewDuration(1 * time.Hour),
					ConnMaxLifetime: time2.NewDuration(1 * time.Hour),
				},
			},
		},
		{
			name: "2",
			args: args{
				conf: testJSONFromString(`{"pool":{"connMaxIdleTime":"","connMaxLifetime":"","maxOpenConns":10,"maxIdleConns":10}}`),
			},
			wantC: &Config{
				Pool: PoolConfig{
					MaxOpenConns:    10,
					MaxIdleConns:    10,
					ConnMaxIdleTime: time2.NewDuration(0 * time.Nanosecond),
					ConnMaxLifetime: time2.NewDuration(0 * time.Nanosecond),
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotC, err := NewConfig(tt.args.conf)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewConfig() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(gotC, tt.wantC) {
				t.Errorf("NewConfig() = %v, want %v", gotC, tt.wantC)
			}
		})
	}
}

func TestBaseConfigSetter_SetConfig(t *testing.T) {
	type args struct {
		conf *config.JSON
	}
	tests := []struct {
		name string
		tr   *BaseConfigSetter
		args args
		want *config.JSON
	}{
		{
			name: "1",
			tr:   &BaseConfigSetter{},
			args: args{
				conf: testJSONFromString(`{
					"username": "",
					"password": "",
					"writeMode": "",
					"column": [],
					"preSql": [],
					"connection": {
						"url": "",
						"table": {
							"schema":"",
							"name":""
						}
					},
					"batchTimeout": "1s",
					"batchSize":1000,
					"bulkOption":{}
				}`),
			},
			want: testJSONFromString(`{
					"username": "",
					"password": "",
					"writeMode": "",
					"column": [],
					"preSql": [],
					"connection": {
						"url": "",
						"table": {
							"schema":"",
							"name":""
						}
					},
					"batchTimeout": "1s",
					"batchSize":1000,
					"bulkOption":{}
				}`),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.tr.SetConfig(tt.args.conf)
			if !reflect.DeepEqual(tt.tr.Config(), tt.want) {
				t.Errorf("got: %v want: %v", tt.tr.Config(), tt.want)
				return
			}
		})
	}
}

func TestBaseConfigSetter_TrimStringChar(t *testing.T) {
	type args struct {
		char string
	}
	tests := []struct {
		name string
		conf *config.JSON
		args args
		want string
	}{
		{
			name: "1",
			conf: testJSONFromString(`{"trimChar":true}`),
			args: args{
				char: "  char    ",
			},
			want: "char",
		},
		{
			name: "2",
			conf: testJSONFromString(`{"trimChar":false}`),
			args: args{
				char: "  char  ",
			},
			want: "  char  ",
		},
		{
			name: "3",
			conf: testJSONFromString(`{}`),
			args: args{
				char: "  char  ",
			},
			want: "  char  ",
		},
		{
			name: "4",
			conf: nil,
			args: args{
				char: "  char  ",
			},
			want: "  char  ",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			b := &BaseConfigSetter{}
			b.SetConfig(tt.conf)
			if got := b.TrimStringChar(tt.args.char); got != tt.want {
				t.Errorf("BaseConfigSetter.TrimStringChar() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestBaseConfigSetter_TrimByteChar(t *testing.T) {
	type args struct {
		char []byte
	}
	tests := []struct {
		name string
		conf *config.JSON
		args args
		want []byte
	}{
		{
			name: "1",
			conf: testJSONFromString(`{"trimChar":true}`),
			args: args{
				char: []byte("  char    "),
			},
			want: []byte("char"),
		},
		{
			name: "2",
			conf: testJSONFromString(`{"trimChar":false}`),
			args: args{
				char: []byte("  char  "),
			},
			want: []byte("  char  "),
		},
		{
			name: "3",
			conf: testJSONFromString(`{}`),
			args: args{
				char: []byte("  char  "),
			},
			want: []byte("  char  "),
		},
		{
			name: "4",
			conf: nil,
			args: args{
				char: []byte("  char  "),
			},
			want: []byte("  char  "),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			b := &BaseConfigSetter{}
			b.SetConfig(tt.conf)
			if got := b.TrimByteChar(tt.args.char); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("BaseConfigSetter.TrimByteChar() = %v, want %v", got, tt.want)
			}
		})
	}
}
