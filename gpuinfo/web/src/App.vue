<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import axios from 'axios'
import type { TabsPaneContext } from 'element-plus'
const json_data = ref([])
onMounted(() => {
  axios.get("http://101.43.186.22:7070/info").then(res => {
    console.log("res:", res.data)
    json_data.value = res.data
  }).catch(error => {
    console.error('捕获到错误:', error);
  });
})

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}
</script>

<template>
  <el-tabs class="demo-tabs" @tab-click="handleClick">
    <el-tab-pane v-for="item in json_data" :key="item.hostname" :label="item.hostname" :name="item.hostname">
      <el-tag class="ml-2" type="success">{{ item.update_time }}</el-tag>
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>CPU</span>
            <el-button class="button" text>Operation button</el-button>
          </div>
        </template>
        <span>
          <div>
            <el-progress type="circle" :percentage="item.data.cpu.cpu_percent" />
        CPU 利用率
          </div>
       
        </span>
      </el-card>

      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>GPU</span>
            <el-button class="button" text>Operation button</el-button>
          </div>
        </template>
          <div v-for="gpu in item.data.gpu">
            <el-divider />
            <p>driver_version: {{ gpu.driver_version }}</p>
            <p>memory_free: {{ gpu.memory_free }}</p>
            <p>memory_total: {{ gpu.memory_total }}</p>
            <p>memory_used: {{ gpu.memory_used }}</p>
            <p>name: {{ gpu.name }}</p>
            <p>temperature_gpu: {{ gpu.temperature_gpu }}</p>

            <el-progress type="circle" :percentage="parseInt(gpu.utilization_gpu.match(/(\d+)/))" />
            GPU 利用率
            <el-progress type="circle" :percentage="parseInt(gpu.utilization_memory.match(/(\d+)/))" />
            GPU 内存利用率
          </div>
      </el-card>

      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>内存</span>
            <el-button class="button" text>Operation button</el-button>
          </div>
        </template>
          <p>total: {{ item.data.mem.total }}</p>
          <p>used: {{ item.data.mem.used }}</p>
      </el-card>

      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>SWAP</span>
            <el-button class="button" text>Operation button</el-button>
          </div>
        </template>
          <p>total: {{ item.data.swap.total }}</p>
          <p>used: {{ item.data.swap.used }}</p>
      </el-card>
      
    </el-tab-pane>
  </el-tabs>
  <!-- <RouterView /> -->
</template>

<style scoped>
.demo-tabs > .el-tabs__content {
  padding: 32px;
  color: #6b778c;
  font-size: 32px;
  font-weight: 600;
}
.demo-progress .el-progress--circle {
  margin-right: 15px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text {
  font-size: 14px;
}

.item {
  margin-bottom: 18px;
}

.box-card {
  margin-top: 10px;
  width: 100%;
  margin-bottom: 10px;
}
</style>
