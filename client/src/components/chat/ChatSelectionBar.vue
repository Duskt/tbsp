<script setup lang="ts">
    import {ref} from 'vue'

    class Tab{
        chatId:string;
        selected: boolean;
        name:string;
        constructor(id:string, name:string = "unnamed", selected: boolean = false){
            this.chatId = id;
            this.name = name;
            this.selected = selected;
        }
        select(){
            for (const tab of tabs.value){
                tab.deselect();
            }
            this.selected = true;
            // show chat data for the previously open chat
            // --> INSERT CODE HERE <--
        }
        deselect(){
            if (this.selected){
            this.selected = false;
            // hide chat data for the previously open chat
            // --> INSERT CODE HERE <--
            }
        }
    }
    const tabs = ref<Tab[]>([new Tab("0", "Main chat", true),
        new Tab("1", "new chat"),
    ]);

</script>

<template>

        <bar>
            <button v-for='tab in tabs' :class="{ selected: tab.selected}" class="tab" @click="tab.select()">
            {{ tab.name }}
            </button>
        </bar>


</template>

<style scoped>
.tab {
  padding: 10px;
  flex:1;
  border-bottom: 2px solid transparent;
  color: #FFFFFF;
  cursor: pointer;
  background-color: #535353;

}

.selected {
  flex:1;
  border-bottom: 0px;
  font-weight: bold;
  background-color: #3D3D3D;
}

bar {
  display: flex;
  flex-direction: row;
  height: 30px;
  background-color: #1A1A1A;
  display: flex;
  padding: 0 16px;
  border-bottom: 0px solid #ddd;
}
</style>