package xcron

import (
	"github.com/jasonlabz/cartl/common/log"
	"github.com/jasonlabz/cartl/common/utils"
	"go.uber.org/zap"
)

var defaultLogger *cronLogger

func init() {
	zapLogger := log.InitLogger(log.WithBasePath("cron"), log.WithFileName("cron.log"))
	defaultLogger = &cronLogger{
		zapLogger,
	}
}

type cronLogger struct {
	logger *log.LoggerWrapper
}

func (l cronLogger) Info(msg string, keysAndValues ...interface{}) {
	log.DefaultLogger().WithAny(checkFields(keysAndValues)).Info(msg)
}

func (l cronLogger) Error(err error, msg string, keysAndValues ...interface{}) {
	log.DefaultLogger().WithError(err).WithAny(checkFields(keysAndValues)).Error(msg)
}

func checkFields(fields []any) (checked []zap.Field) {
	checked = make([]zap.Field, 0)

	if len(fields) == 0 {
		return
	}

	_, isZapField := fields[0].(zap.Field)
	if isZapField {
		for _, field := range fields {
			if f, ok := field.(zap.Field); ok {
				checked = append(checked, f)
			}
		}
		return
	}

	if len(fields) == 1 {
		checked = append(checked, zap.Any("log_field", utils.GetString(fields[0])))
		return
	}

	for i := 0; i < len(fields)-1; {
		checked = append(checked, zap.Any(utils.GetString(fields[i]), utils.GetString(fields[i+1])))
		if i == len(fields)-3 {
			checked = append(checked, zap.Any("log_field", utils.GetString(fields[i+2])))
		}
		i += 2
	}

	return
}
