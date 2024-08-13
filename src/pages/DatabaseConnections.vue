<template>
  <div class="database-connections">
    <h1>{{ t`Database Connections` }}</h1>
    <div class="new-connection">
      <h2>{{ t`New Database Connection` }}</h2>
      <form @submit.prevent="saveConnection">
        <div class="form-group">
          <label for="id">{{ t`ID` }}</label>
          <input type="text" id="id" v-model="connection.id" required />
        </div>
        <div class="form-group">
          <label for="databaseType">{{ t`Database type` }}</label>
          <select id="databaseType" v-model="connection.databaseType" required>
            <option value="SQL Server">{{ t`SQL Server` }}</option>
            <!-- Add more database types as needed -->
          </select>
        </div>
        <div class="form-group">
          <label for="authenticationMethod">{{ t`Authentication method` }}</label>
          <select id="authenticationMethod" v-model="connection.authenticationMethod" required>
            <option value="">{{ t`Select authentication method` }}</option>
            <!-- Add more authentication methods as needed -->
          </select>
        </div>
        <div class="form-group">
          <label for="connectionString">{{ t`Connection String` }}</label>
          <input type="text" id="connectionString" v-model="connection.connectionString" required />
        </div>
        <div class="form-group">
          <label for="connectionTimeout">{{ t`Connection timeout (ms)` }}</label>
          <input type="number" id="connectionTimeout" v-model="connection.connectionTimeout" />
        </div>
        <div class="form-group">
          <label for="requestTimeout">{{ t`Request timeout (ms)` }}</label>
          <input type="number" id="requestTimeout" v-model="connection.requestTimeout" />
        </div>
        <div class="form-actions">
          <button type="button" @click="testConnection">{{ t`Test Connection` }}</button>
          <button type="button" @click="cancel">{{ t`Cancel` }}</button>
          <button type="submit">{{ t`Save` }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { t } from 'fyo';

export default defineComponent({
  name: 'DatabaseConnections',
  data() {
    return {
      connection: {
        id: '',
        databaseType: '',
        authenticationMethod: '',
        connectionString: '',
        connectionTimeout: null,
        requestTimeout: null,
      },
    };
  },
  methods: {
    async testConnection() {
      // Implement the logic to test the database connection
    },
    cancel() {
      // Implement the logic to cancel the connection creation
    },
    async saveConnection() {
      // Implement the logic to save the database connection
    },
  },
});
</script>

<style scoped>
.database-connections {
  padding: 20px;
}

.new-connection {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.form-actions button {
  padding: 10px 20px;
}
</style>
