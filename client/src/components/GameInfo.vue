<script setup>
import { ref } from 'vue'
const time_left = ref(300);
const day = ref(1);
const role = ref("MAFIA");
const players = ref(16)


function show_time(time){
    let minute = Math.floor(time/60)
    let second = time-(minute*60)

    return `${minute}:${second}`
}
</script>

<template>
    <div class="info-bar">
        <h1> YOU ARE </h1>
        <div class="role-icon">
            <p>{{ role }}</p>
        </div>
        <p>Day: {{ day}}</p>
        <p>Time until nightfall: {{ show_time(time_left)}}</p>
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