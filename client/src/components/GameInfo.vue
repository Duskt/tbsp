<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const day = ref(1);
const role = ref("MAFIA");
const players = ref(16)
const end_time = ref(Date.now() + 5 * 60 * 1000)
const now = ref(Date.now())

let intervalId = null

onMounted(() => {
  intervalId = setInterval(() => {
    now.value = Date.now()
    if (now.value >= end_time.value) {
      clearInterval(intervalId)
    }
  }, 1000)
})

onUnmounted(() => {
  clearInterval(intervalId)
})

// Time remaining in seconds
const time_left = computed(() => {
    const diff = end_time.value - now.value
    return diff > 0 ? Math.floor(diff / 1000) : 0
})


function show_time(){
    let minute = Math.floor(time_left.value/60)
    let second = time_left.value % 60
    return `${String(minute).padStart(1,"0")}:${String(second).padStart(2,"0")}`
}
</script>

<template>
    <div class="info-bar">
        <h1> YOU ARE </h1>
        <div class="role-icon">
            <p>{{ role }}</p>
        </div>
        <p>Day: {{ day}}</p>
        <p>Time until nightfall: {{ show_time()}}</p>
        <p>Players remaining: {{ players }}</p>
    </div>

</template>

<style scoped>

h1{
    font-family:"kanit";
    text-align: center;
    font-size:100;
    font-weight: bold;
    color: #FFFFFF;
}


.role-icon{
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #D9D9D9;
    height: 25vw;
    width: 25vw;
}

.role-icon p{
    font-family:"kanit";
    color: #960B22;
    text-align: center;
    font-size:70pt;
}

p{
    color: #FFFFFF;
    text-align: center;
    font-size:40;
    margin:10;
}


.info-bar{
    display: flex;
    align-items: center;
    flex-direction: column;
    height:100vh;
    width:30vw;
}
</style>