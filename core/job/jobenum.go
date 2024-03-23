package job

import "fmt"

type JobType int

var (
	DayJob          JobType = 1
	MonthJob        JobType = 2
	WeekJob         JobType = 3
	DurationTimeJob JobType = 4
)

type TaskScheduleModel struct {
	JobType    JobType `json:"job_type"` //  1|每天；2|每月；3|每周；4|间隔（每隔2个小时，每隔30分钟）
	Seconds    *int    `json:"seconds"`
	Minutes    *int    `json:"minutes"`
	Hours      *int    `json:"hours"`
	DayOfMonth []int   `json:"day_of_month"`
	Month      *int    `json:"month"`
	DayOfWeek  []int   `json:"day_of_week"`
}

// GenCrontabStr 生成6位crontab表达式，仅支持固定间隔时间 https://blog.csdn.net/Michael_lcf/article/details/118784383
// 1、 Seconds （秒）
// 2、 Minutes（分）
// 3、 Hours（小时）
// 4、 Day-of-Month （天）
// 5、 Month（月）
// 6、 Day-of-Week （周）
func GenCrontabStr(jobType JobType, duration int) (spec string) {
	switch jobType {
	case DayJob:
		spec = fmt.Sprintf("*/%d * * * * ?", duration)
	case MonthJob:
		spec = fmt.Sprintf("0 */%d * * * ?", duration)
	case WeekJob:
		spec = fmt.Sprintf("0 0 */%d * * ?", duration)
	case DurationTimeJob:
		spec = fmt.Sprintf("0 0 0 */%d * ?", duration)
	default:
		spec = "0 0 */24 * * ?"
	}
	return
}
