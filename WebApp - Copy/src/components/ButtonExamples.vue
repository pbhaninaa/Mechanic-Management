<template>
  <PageContainer>
      <v-card-title class="text-h5 mb-4">
        Button Component Examples
      </v-card-title>
      
      <!-- Basic Buttons -->
      <v-card class="mb-6" variant="outlined">
        <v-card-title class="text-h6 pa-4">Basic Buttons</v-card-title>
        <v-card-text class="pa-4">
          <div class="d-flex flex-wrap gap-3 mb-4">
            <Button label="Primary" color="primary" />
            <Button label="Secondary" color="secondary" />
            <Button label="Success" color="success" />
            <Button label="Error" color="error" />
            <Button label="Warning" color="warning" />
            <Button label="Info" color="info" />
          </div>
        </v-card-text>
      </v-card>

      <!-- Button Variants -->
      <v-card class="mb-6" variant="outlined">
        <v-card-title class="text-h6 pa-4">Button Variants</v-card-title>
        <v-card-text class="pa-4">
          <div class="d-flex flex-wrap gap-3 mb-4">
            <Button label="Elevated" variant="elevated" />
            <Button label="Flat" variant="flat" />
            <Button label="Tonal" variant="tonal" />
            <Button label="Outlined" variant="outlined" />
            <Button label="Text" variant="text" />
            <Button label="Plain" variant="plain" />
          </div>
        </v-card-text>
      </v-card>

      <!-- Button Sizes -->
      <v-card class="mb-6" variant="outlined">
        <v-card-title class="text-h6 pa-4">Button Sizes</v-card-title>
        <v-card-text class="pa-4">
          <div class="d-flex flex-wrap align-center gap-3 mb-4">
            <Button label="Extra Small" size="x-small" />
            <Button label="Small" size="small" />
            <Button label="Default" size="default" />
            <Button label="Large" size="large" />
            <Button label="Extra Large" size="x-large" />
          </div>
        </v-card-text>
      </v-card>

      <!-- Icon Buttons -->
      <v-card class="mb-6" variant="outlined">
        <v-card-title class="text-h6 pa-4">Icon Buttons</v-card-title>
        <v-card-text class="pa-4">
          <div class="d-flex flex-wrap gap-3 mb-4">
            <Button label="Save" icon="mdi-content-save" />
            <Button label="Delete" icon="mdi-delete" color="error" />
            <Button label="Edit" icon="mdi-pencil" color="warning" />
            <Button label="Download" icon="mdi-download" color="success" />
            <Button label="Upload" icon="mdi-upload" color="info" />
            <Button label="Settings" icon="mdi-cog" color="secondary" />
          </div>
        </v-card-text>
      </v-card>

      <!-- Icon Only Buttons -->
      <v-card class="mb-6" variant="outlined">
        <v-card-title class="text-h6 pa-4">Icon Only Buttons</v-card-title>
        <v-card-text class="pa-4">
          <div class="d-flex flex-wrap gap-3 mb-4">
            <Button icon="mdi-heart" tooltip="Like" />
            <Button icon="mdi-share" tooltip="Share" color="success" />
            <Button icon="mdi-bookmark" tooltip="Bookmark" color="warning" />
            <Button icon="mdi-close" tooltip="Close" color="error" />
            <Button icon="mdi-refresh" tooltip="Refresh" color="info" />
            <Button icon="mdi-menu" tooltip="Menu" color="secondary" />
          </div>
        </v-card-text>
      </v-card>

      <!-- Loading States -->
      <v-card class="mb-6" variant="outlined">
        <v-card-title class="text-h6 pa-4">Loading States</v-card-title>
        <v-card-text class="pa-4">
          <div class="d-flex flex-wrap gap-3 mb-4">
            <Button 
              label="Loading Button" 
              :loading="loading1" 
              @click="simulateLoading(1)"
            />
            <Button 
              label="Loading with Icon" 
              icon="mdi-cloud-upload"
              :loading="loading2" 
              :show-icon-when-loading="true"
              @click="simulateLoading(2)"
            />
            <Button 
              label="Loading Success" 
              color="success"
              :loading="loading3" 
              @click="simulateLoading(3)"
            />
            <Button 
              label="Loading Error" 
              color="error"
              :loading="loading4" 
              @click="simulateLoading(4)"
            />
          </div>
        </v-card-text>
      </v-card>

      <!-- Disabled States -->
      <v-card class="mb-6" variant="outlined">
        <v-card-title class="text-h6 pa-4">Disabled States</v-card-title>
        <v-card-text class="pa-4">
          <div class="d-flex flex-wrap gap-3 mb-4">
            <Button label="Disabled Primary" disabled />
            <Button label="Disabled with Icon" icon="mdi-lock" disabled />
            <Button label="Disabled Outlined" variant="outlined" disabled />
            <Button label="Disabled Text" variant="text" disabled />
          </div>
        </v-card-text>
      </v-card>

      <!-- Block Buttons -->
      <v-card class="mb-6" variant="outlined">
        <v-card-title class="text-h6 pa-4">Block Buttons</v-card-title>
        <v-card-text class="pa-4">
          <div class="mb-4">
            <Button label="Full Width Button" block class="mb-3" />
            <Button label="Full Width with Icon" icon="mdi-check" block color="success" />
          </div>
        </v-card-text>
      </v-card>

      <!-- Rounded Buttons -->
      <v-card class="mb-6" variant="outlined">
        <v-card-title class="text-h6 pa-4">Rounded Buttons</v-card-title>
        <v-card-text class="pa-4">
          <div class="d-flex flex-wrap gap-3 mb-4">
            <Button label="Rounded" rounded />
            <Button label="Rounded Icon" icon="mdi-plus" rounded color="success" />
            <Button label="Rounded Outlined" variant="outlined" rounded />
            <Button label="Rounded Text" variant="text" rounded />
          </div>
        </v-card-text>
      </v-card>

      <!-- Custom Sizes -->
      <v-card class="mb-6" variant="outlined">
        <v-card-title class="text-h6 pa-4">Custom Sizes</v-card-title>
        <v-card-text class="pa-4">
          <div class="d-flex flex-wrap gap-3 mb-4">
            <Button label="Custom Width" :width="200" />
            <Button label="Custom Height" :height="60" />
            <Button label="Custom Both" :width="150" :height="50" />
            <Button icon="mdi-star" :width="50" :height="50" tooltip="Custom Square" />
          </div>
        </v-card-text>
      </v-card>

      <!-- Interactive Examples -->
      <v-card class="mb-6" variant="outlined">
        <v-card-title class="text-h6 pa-4">Interactive Examples</v-card-title>
        <v-card-text class="pa-4">
          <div class="d-flex flex-wrap gap-3 mb-4">
            <Button 
              label="Click Counter" 
              :label="`Clicked ${clickCount} times`"
              @click="incrementCounter"
            />
            <Button 
              label="Toggle State" 
              :color="toggleState ? 'success' : 'primary'"
              :label="toggleState ? 'ON' : 'OFF'"
              @click="toggleState = !toggleState"
            />
            <Button 
              label="Show Alert" 
              icon="mdi-alert"
              color="warning"
              @click="showAlert"
            />
            <Button 
              label="Copy to Clipboard" 
              icon="mdi-content-copy"
              color="info"
              @click="copyToClipboard"
            />
          </div>
          
          <!-- Counter Display -->
          <v-alert
            v-if="clickCount > 0"
            type="info"
            class="mt-3"
            closable
            @click:close="clickCount = 0"
          >
            Button has been clicked {{ clickCount }} times!
          </v-alert>
        </v-card-text>
      </v-card>

      <!-- Form Buttons -->
      <v-card class="mb-6" variant="outlined">
        <v-card-title class="text-h6 pa-4">Form Buttons</v-card-title>
        <v-card-text class="pa-4">
          <v-form @submit.prevent="submitForm">
            <v-row>
              <v-col cols="12" md="6">
                <InputField
                  v-model="formData.name"
                  label="Name"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <InputField
                  v-model="formData.email"
                  label="Email"
                  type="email"
                  required
                />
              </v-col>
            </v-row>
            
            <div class="d-flex gap-3 mt-4">
              <Button 
                type="submit"
                label="Submit Form" 
                icon="mdi-check"
                color="success"
                :loading="formLoading"
              />
              <Button 
                type="reset"
                label="Reset" 
                icon="mdi-refresh"
                variant="outlined"
                @click="resetForm"
              />
              <Button 
                label="Cancel" 
                icon="mdi-close"
                variant="text"
                color="error"
                @click="cancelForm"
              />
            </div>
          </v-form>
        </v-card-text>
      </v-card>

      <!-- Button Groups -->
      <v-card class="mb-6" variant="outlined">
        <v-card-title class="text-h6 pa-4">Button Groups</v-card-title>
        <v-card-text class="pa-4">
          <div class="mb-4">
            <h4 class="mb-2">Action Group</h4>
            <div class="d-flex gap-2">
              <Button label="Edit" icon="mdi-pencil" size="small" />
              <Button label="Save" icon="mdi-content-save" size="small" color="success" />
              <Button label="Cancel" icon="mdi-close" size="small" variant="outlined" />
            </div>
          </div>
          
          <div class="mb-4">
            <h4 class="mb-2">Navigation Group</h4>
            <div class="d-flex gap-2">
              <Button label="Previous" icon="mdi-chevron-left" variant="outlined" />
              <Button label="Next" icon="mdi-chevron-right" icon-position="right" />
            </div>
          </div>
          
          <div class="mb-4">
            <h4 class="mb-2">Status Group</h4>
            <div class="d-flex gap-2">
              <Button label="Draft" icon="mdi-file-document-outline" variant="outlined" />
              <Button label="Published" icon="mdi-publish" color="success" />
              <Button label="Archived" icon="mdi-archive" color="warning" />
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Code Examples -->
      <v-expansion-panels class="mt-4">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="me-2">mdi-code-tags</v-icon>
            View Code Examples
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-tabs>
              <v-tab>Basic Usage</v-tab>
              <v-tab>With Icons</v-tab>
              <v-tab>Loading States</v-tab>
              <v-tab>Custom Styling</v-tab>
              
              <v-tab-item>
                <pre><code>{{ basicUsageCode }}</code></pre>
              </v-tab-item>
              
              <v-tab-item>
                <pre><code>{{ iconUsageCode }}</code></pre>
              </v-tab-item>
              
              <v-tab-item>
                <pre><code>{{ loadingCode }}</code></pre>
              </v-tab-item>
              
              <v-tab-item>
                <pre><code>{{ customStylingCode }}</code></pre>
              </v-tab-item>
            </v-tabs>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
</PageContainer>
</template>

<script setup>
import { ref, reactive } from 'vue'
import Button from './Button.vue'
import InputField from './InputField.vue'
import PageContainer from "../components/PageContainer.vue";

// State
const clickCount = ref(0)
const toggleState = ref(false)
const formLoading = ref(false)

const loading1 = ref(false)
const loading2 = ref(false)
const loading3 = ref(false)
const loading4 = ref(false)

const formData = reactive({
  name: '',
  email: ''
})

// Methods
const incrementCounter = () => {
  clickCount.value++
}

const showAlert = () => {
  alert('Hello! This is an alert from the button.')
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText('Button component copied!')
    alert('Text copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy: ', err)
    alert('Failed to copy to clipboard')
  }
}

const simulateLoading = async (buttonNumber) => {
  const loadingRef = buttonNumber === 1 ? loading1 : 
                     buttonNumber === 2 ? loading2 :
                     buttonNumber === 3 ? loading3 : loading4
  
  loadingRef.value = true
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  loadingRef.value = false
}

const submitForm = async () => {
  formLoading.value = true
  
  try {
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    alert('Form submitted successfully!')
    resetForm()
  } catch (error) {
    alert('Form submission failed')
  } finally {
    formLoading.value = false
  }
}

const resetForm = () => {
  formData.name = ''
  formData.email = ''
}

const cancelForm = () => {
  if (confirm('Are you sure you want to cancel?')) {
    resetForm()
  }
}

// Code examples
const basicUsageCode = `<template>
  <Button label="Click Me" />
  <Button label="Primary" color="primary" />
  <Button label="Success" color="success" />
  <Button label="Error" color="error" />
</template>`

const iconUsageCode = `<template>
  <Button label="Save" icon="mdi-content-save" />
  <Button label="Delete" icon="mdi-delete" color="error" />
  <Button icon="mdi-heart" tooltip="Like" />
</template>`

const loadingCode = `<template>
  <Button 
    label="Loading" 
    :loading="isLoading"
    @click="handleClick"
  />
  <Button 
    label="Loading with Icon" 
    icon="mdi-upload"
    :loading="isLoading"
    :show-icon-when-loading="true"
  />
</template>`

const customStylingCode = `<template>
  <Button 
    label="Custom Size" 
    :width="200" 
    :height="50"
  />
  <Button 
    label="Rounded" 
    rounded
  />
  <Button 
    label="Block Button" 
    block
  />
</template>`
</script>

<style scoped>
pre {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  white-space: pre-wrap;
}

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mb-6 {
  margin-bottom: 24px;
}

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.me-2 {
  margin-inline-end: 8px;
}
</style>
