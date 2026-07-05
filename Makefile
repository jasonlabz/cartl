# 工作目录变量（CURDIR 是 make 内置变量，跨平台兼容）
WORKDIR := $(CURDIR)
OUTDIR  := $(WORKDIR)/output

# 目标二进制名称
TARGETNAME = cartl
ifeq ($(OS),Windows_NT)
  TARGETNAME = cartl.exe
  # 针对 Windows cmd.exe，将输出目录的斜杠转换为反斜杠
  OUTDIR_WIN := $(subst /,\,$(OUTDIR))
endif

# 跨平台获取 Go 包列表 (修正了语法并使用标准写法 ./...)
GOPKGS := $(shell go list ./...)

# 设置编译时所需要的 Go 环境
export GOENV = $(WORKDIR)/go.env

# 执行编译，可使用命令 make 或 make all 执行
all: clean test package

# prepare阶段， 下载 Go 依赖
prepare:
	go env
	go mod download || go mod download -x

# compile 阶段，执行编译命令
compile: build
build: prepare
	go build -o $(WORKDIR)/bin/$(TARGETNAME)

# test 阶段，进行单元测试
test: prepare
	go test -race -timeout=300s -v -cover $(GOPKGS) -coverprofile=coverage.out

# 前端构建
frontend:
	cd web && pnpm install --frozen-lockfile && pnpm build

# 将前端产物复制到 webroot 目录
ifeq ($(OS),Windows_NT)
copy-frontend: frontend
	-if not exist webroot mkdir webroot
	xcopy /E /I /Y /Q web\dist webroot
else
copy-frontend: frontend
	@mkdir -p webroot
	cp -r web/dist/* webroot/
endif

# package 阶段，对编译产出进行打包
ifeq ($(OS),Windows_NT)
package: build copy-frontend
	-if exist $(OUTDIR_WIN) rmdir /s /q $(OUTDIR_WIN)
	mkdir $(OUTDIR_WIN)
	xcopy /E /I /Y /Q bin $(OUTDIR_WIN)\bin
	xcopy /E /I /Y /Q conf $(OUTDIR_WIN)\conf
	xcopy /E /I /Y /Q webroot $(OUTDIR_WIN)\webroot
	-if exist data xcopy /E /I /Y /Q data $(OUTDIR_WIN)\data
else
package: build copy-frontend
	rm -rf $(OUTDIR)
	mkdir -p $(OUTDIR)
	cp -a bin $(OUTDIR)/bin
	cp -a conf $(OUTDIR)/conf
	cp -a webroot $(OUTDIR)/webroot
	@if [ -d "data" ]; then cp -r data $(OUTDIR)/data; fi
	tree $(OUTDIR) || ls -R $(OUTDIR)
endif

# Docker 镜像构建
docker:
	docker build -t cartl:latest .

# clean 阶段，清除过程中的输出
ifeq ($(OS),Windows_NT)
clean:
	-if exist $(OUTDIR_WIN) rmdir /s /q $(OUTDIR_WIN)
	-if exist bin rmdir /s /q bin
	-if exist webroot rmdir /s /q webroot
else
clean:
	rm -rf $(OUTDIR) bin webroot
endif

# clean middle 阶段，清除过程中的输出
ifeq ($(OS),Windows_NT)
clean-middle:
	-if exist bin rmdir /s /q bin
	-if exist webroot rmdir /s /q webroot
else
clean-middle:
	rm -rf bin webroot
endif

# avoid filename conflict and speed up build
.PHONY: all prepare compile test package clean clean-middle build frontend copy-frontend docker
