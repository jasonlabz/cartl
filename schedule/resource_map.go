package schedule

import (
	"sync"
)

type mappedResourceWrapper struct {
	resource MappedResource
	useCount int
}

// ResourceMap 资源映射，每一个资源类似于智能指针
type ResourceMap struct {
	mu sync.Mutex

	resources map[string]*mappedResourceWrapper
}

// NewResourceMap 创建资源映射
func NewResourceMap() *ResourceMap {
	return &ResourceMap{
		resources: make(map[string]*mappedResourceWrapper),
	}
}

// Get 根据关键字key获取资源，若不存在，就通过函数create创建资源
// 若创建资源错误时，就会返回错误
func (r *ResourceMap) Get(key string, create func() (MappedResource, error)) (resource MappedResource, err error) {
	var ok bool
	r.mu.Lock()
	if resource, ok = r.loadLocked(key); ok {
		r.mu.Unlock()
		return
	}
	r.mu.Unlock()
	var newResource MappedResource
	if newResource, err = create(); err != nil {
		return nil, err
	}
	r.mu.Lock()
	r.storageLocked(newResource)
	r.mu.Unlock()
	resource = newResource
	return
}

// Release 根据资源resource释放资源，若不存在，就通过函数create创建资源
// 若创建资源错误时，就会返回错误
func (r *ResourceMap) Release(resource MappedResource) (err error) {
	r.mu.Lock()
	fn := r.releaseLocked(resource)
	r.mu.Unlock()
	return fn()
}

// UseCount 根据资源resource计算已使用个数
func (r *ResourceMap) UseCount(resource MappedResource) int {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.useCountLocked(resource)
}

func (r *ResourceMap) loadLocked(key string) (resource MappedResource, ok bool) {
	var rw *mappedResourceWrapper
	if rw, ok = r.resources[key]; ok {
		resource, rw.useCount = rw.resource, rw.useCount+1
		return
	}
	return
}

func (r *ResourceMap) storageLocked(resource MappedResource) {
	r.resources[resource.Key()] = &mappedResourceWrapper{
		resource: resource,
		useCount: 1,
	}
}

func (r *ResourceMap) releaseLocked(resource MappedResource) func() error {
	if rw, ok := r.resources[resource.Key()]; ok {
		rw.useCount--
		if rw.useCount <= 0 {
			delete(r.resources, resource.Key())
			return func() error {
				return rw.resource.Close()
			}
		}
	}
	return func() error {
		return nil
	}
}

func (r *ResourceMap) useCountLocked(resource MappedResource) (n int) {
	if rw, ok := r.resources[resource.Key()]; ok {
		n = rw.useCount
	}
	return
}
