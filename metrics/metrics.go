package metrics

import (
	"log"
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/jasonlabz/cartl/element"
)

var (
	processedRecords = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "etl_processed_records_total",
		Help: "Total number of processed records",
	})
	failedRecords = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "etl_failed_records_total",
		Help: "Total number of failed records",
	})
)

func init() {
	prometheus.MustRegister(processedRecords, failedRecords)
}

func logRecord(record element.Record) {
	if record.Error() != nil {
		failedRecords.Inc()
		log.Printf("Failed record: %v, Error: %v", record.String(), record.Error())
	} else {
		processedRecords.Inc()
		log.Printf("Processed record: %v", record.String())
	}
}

func startMetricsServer() {
	http.Handle("/metrics", promhttp.Handler())
	go http.ListenAndServe(":2112", nil)
}
