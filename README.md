git设置全局http代理和https代理
git config --global http.proxy 127.0.0.1:7890
git config --global https.proxy 127.0.0.1:7890

取消这两个全局代表
git config --global --unset http.proxy
git config --global --unset https.proxy