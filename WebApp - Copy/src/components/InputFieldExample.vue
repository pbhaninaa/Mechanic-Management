<template>
  <PageContainer>
      <v-card-title class="text-h5 mb-4">
        InputField Component Examples
      </v-card-title>
      
      <v-form ref="form" v-model="formValid" @submit.prevent="submitForm">
        <v-row>
          <!-- Username Input -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.username"
              label="Username"
              type="text"
              placeholder="Enter your username"
              required
            />
          </v-col>

          <!-- Full Name Input -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.name"
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              required
            />
          </v-col>

          <!-- Email Input -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.email"
              label="Email Address"
              type="email"
              required
            />
          </v-col>

          <!-- Password Input -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.password"
              label="Password"
              type="password"
              required
            />
          </v-col>

          <!-- Phone Number Input -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.phone"
              label="Phone Number"
              type="tel"
              placeholder="Enter 10-digit phone number"
              country-code="+27"
            />
          </v-col>

          <!-- Money Input -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.salary"
              label="Monthly Salary"
              type="money"
              currency-symbol="R"
              required
            />
          </v-col>

          <!-- Money Input with Different Currency -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.bonus"
              label="Bonus Amount"
              type="money"
              currency-symbol="$"
              placeholder="Enter bonus amount"
            />
          </v-col>


          <!-- URL Input -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.website"
              label="Website"
              type="url"
              placeholder="https://example.com"
            />
          </v-col>

          <!-- Search Input -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.search"
              label="Search"
              type="search"
              placeholder="Search for something..."
            />
          </v-col>

          <!-- ID Number Input -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.idNumber"
              label="ID Number"
              type="text"
              placeholder="Enter 13-digit ID number"
            />
          </v-col>

          <!-- Age Input -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.age"
              label="Age"
              type="number"
              placeholder="Enter your age"
            />
          </v-col>

          <!-- Address Input -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.address"
              label="Address"
              type="text"
              placeholder="Enter your address"
            />
          </v-col>

          <!-- City Input -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.city"
              label="City"
              type="text"
              placeholder="Enter your city"
            />
          </v-col>

          <!-- Company Input -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.company"
              label="Company"
              type="text"
              placeholder="Enter company name"
            />
          </v-col>

          <!-- Job Title Input -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.jobTitle"
              label="Job Title"
              type="text"
              placeholder="Enter your job title"
            />
          </v-col>

          <!-- Date Input -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.birthDate"
              label="Birth Date"
              type="date"
            />
          </v-col>

          <!-- Disabled Input -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.disabledField"
              label="Disabled Field"
              type="text"
              disabled
              value="This field is disabled"
            />
          </v-col>

          <!-- Readonly Input -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.readonlyField"
              label="Readonly Field"
              type="text"
              readonly
              value="This field is readonly"
            />
          </v-col>

          <!-- Input with Custom Rules -->
          <v-col cols="12">
            <InputField
              v-model="formData.customField"
              label="Custom Validation Field"
              type="text"
              placeholder="Must be exactly 5 characters"
              :extra-rules="customRules"
            />
          </v-col>

          <!-- Input with Success State -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.successField"
              label="Success Field"
              type="text"
              :success="true"
              success-messages="This field is valid!"
            />
          </v-col>

          <!-- Input with Error State -->
          <v-col cols="12" md="6">
            <InputField
              v-model="formData.errorField"
              label="Error Field"
              type="text"
              :error-messages="['This field has an error']"
            />
          </v-col>

          <!-- Input with Hint -->
          <v-col cols="12">
            <InputField
              v-model="formData.hintField"
              label="Field with Hint"
              type="text"
              hint="This is a helpful hint"
              :persistent-hint="true"
            />
          </v-col>
        </v-row>

        <!-- Form Actions -->
        <v-row class="mt-4">
          <v-col cols="12" class="d-flex justify-end">
            <v-btn
              type="submit"
              color="primary"
              :disabled="!formValid"
              :loading="loading"
            >
              Submit Form
            </v-btn>
          </v-col>
        </v-row>

        <!-- Form Data Display -->
        <v-expansion-panels class="mt-4" v-if="showFormData">
          <v-expansion-panel>
            <v-expansion-panel-title>
              View Form Data (for debugging)
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Toggle for form data -->
        <v-btn
          variant="text"
          @click="showFormData = !showFormData"
          class="mt-2"
        >
          {{ showFormData ? 'Hide' : 'Show' }} Form Data
        </v-btn>
      </v-form>
</PageContainer>
</template>

<script setup>
import { ref, reactive } from 'vue'
import InputField from './InputField.vue';
import PageContainer from "../components/PageContainer.vue";

// Form state
const form = ref(null)
const formValid = ref(false)
const loading = ref(false)
const showFormData = ref(false)

// Form data
const formData = reactive({
  username: '',
  name: '',
  email: '',
  password: '',
  phone: '',
  salary: '',
  bonus: '',
  age: '',
  website: '',
  search: '',
  idNumber: '',
  address: '',
  city: '',
  company: '',
  jobTitle: '',
  birthDate: '',
  disabledField: 'This field is disabled',
  readonlyField: 'This field is readonly',
  customField: '',
  successField: 'Valid input',
  errorField: '',
  hintField: ''
})

// Custom validation rules
const customRules = [
  v => !v || v.length === 5 || 'Field must be exactly 5 characters'
]

// Form submission
const submitForm = async () => {
  loading.value = true
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('Form submitted:', formData)
    alert('Form submitted successfully!')
  } catch (error) {
    console.error('Form submission error:', error)
    alert('Error submitting form')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
pre {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}
</style>
