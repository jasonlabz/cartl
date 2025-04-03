package controller

import (
	"github.com/gin-gonic/gin"
	"github.com/jasonlabz/cartl/common/consts"

	base "github.com/jasonlabz/cartl/common/ginx"
)

// HealthCheck 健康检查
//
//	@Summary	健康检查
//	@Tags		健康检查
//	@Accept		json
//	@Produce	json
//	@Router		/health-check [get]
func HealthCheck(c *gin.Context) {
	base.JsonResult(c, consts.APIVersionV1, "success", nil)
}
