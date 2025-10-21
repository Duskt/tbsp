<script setup>
import ws from '../ws';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const loginVsSignUp = ref(true);
const router = useRouter();
</script>

<template>
  <box>
    <form v-if="loginVsSignUp">
      <label for="username">Username:</label><br />
      <input type="text" id="username" name="username" minlength="4" required /><br />
      <label for="password">Password:</label><br />
      <input type="password" id="password" name="password" minlength="8" required /><br />
      <input class="button" type="submit" value="Sign in" />
    </form>
    <signButton v-if="loginVsSignUp">
      Don't have an account?<br />
      <button class="button" v-on:click="loginVsSignUp = false">Sign up here</button>
    </signButton>
    <form v-if="!loginVsSignUp">
      <label for="username">Username:</label><br />
      <input type="text" id="username" name="username" minlength="4" required /><br />
      <label for="password">Password:</label><br />
      <input type="password" id="password" name="password" minlength="8" required /><br />
      <label for="Cpassword">Confirm password:</label><br />
      <input type="password" id="Cpassword" name="Cpassword" minlength="8" required /><br />
      <input class="button" type="submit" value="Sign up" />
    </form>
    <signButton v-if="!loginVsSignUp">
      Already have an account?<br />
      <button class="button" v-on:click="loginVsSignUp = true">Log in here</button>
    </signButton>
  </box>
</template>

<style scoped>
box {
  width: fit-content;
  height: fit-content;
  background-color: #4d4d4d;
  font-size: 20px;
  justify-content: center;
  padding: 10px;
  border-radius: 10px;
}
signButton {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
.button {
  font-size: 20px;
  background-color: 535353;
  padding: 3px;
  border-radius: 4px;
  padding-left: 10px;
  padding-right: 10px;
}
form {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px;
}
</style>
