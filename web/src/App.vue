<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type HealthState = 'checking' | 'online' | 'offline'

const serviceName = 'cartl'
const apiBasePath = `/${serviceName}/api/v1`
const swaggerPath = `/${serviceName}/doc.html`
const healthText = ref('Checking service status')
const healthState = ref<HealthState>('checking')

const statusLabel = computed(() => {
  if (healthState.value === 'online') {
    return 'Online'
  }
  if (healthState.value === 'offline') {
    return 'Offline'
  }
  return 'Checking'
})

onMounted(async () => {
  try {
    const response = await fetch('/health-check')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const payload = await response.json()
    healthText.value = Array.isArray(payload.data) ? String(payload.data[0] ?? 'success') : 'success'
    healthState.value = 'online'
  } catch (error) {
    healthText.value = error instanceof Error ? error.message : 'Health check failed'
    healthState.value = 'offline'
  }
})
</script>

<template>
  <main class="page-shell">
    <section class="hero-band">
      <div class="hero-copy">
        <p class="eyebrow">Potato + Gin Web Template</p>
        <h1>{{ serviceName }}</h1>
        <p class="hero-text">
          A minimal Vue entry point for checking service status, API paths, and generated documentation.
        </p>
      </div>
      <div class="status-panel" :data-state="healthState">
        <span class="status-dot" />
        <span>{{ statusLabel }}</span>
        <strong>{{ healthText }}</strong>
      </div>
    </section>

    <section class="quick-links" aria-label="Quick links">
      <a class="link-tile" href="/health-check">
        <span class="tile-label">Health</span>
        <strong>/health-check</strong>
      </a>
      <a class="link-tile" :href="swaggerPath">
        <span class="tile-label">Swagger</span>
        <strong>{{ swaggerPath }}</strong>
      </a>
      <div class="link-tile">
        <span class="tile-label">API Base</span>
        <strong>{{ apiBasePath }}</strong>
      </div>
    </section>

    <section class="flow-band" aria-label="Project flow">
      <div class="flow-step">
        <span>01</span>
        <strong>Controller</strong>
        <p>Parse request data and return a unified response.</p>
      </div>
      <div class="flow-step">
        <span>02</span>
        <strong>Service</strong>
        <p>Keep business logic outside Gin handlers.</p>
      </div>
      <div class="flow-step">
        <span>03</span>
        <strong>Resource</strong>
        <p>Initialize shared clients through bootstrap.</p>
      </div>
    </section>
  </main>
</template>

