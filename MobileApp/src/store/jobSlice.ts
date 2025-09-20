import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Job, JobState, CreateJobData, UpdateJobData } from '../types';
import apiService from '../services/api';

// Async thunks
export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (filters?: { status?: string; category?: string; priority?: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.getJobs(filters);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch jobs');
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchJobById = createAsyncThunk(
  'jobs/fetchJobById',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getJobById(jobId);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch job');
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData: CreateJobData, { rejectWithValue }) => {
    try {
      const response = await apiService.createJob(jobData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to create job');
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async ({ jobId, jobData }: { jobId: string; jobData: UpdateJobData }, { rejectWithValue }) => {
    try {
      const response = await apiService.updateJob(jobId, jobData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to update job');
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.deleteJob(jobId);
      if (response.success) {
        return jobId;
      } else {
        return rejectWithValue(response.message || 'Failed to delete job');
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const acceptJob = createAsyncThunk(
  'jobs/acceptJob',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.acceptJob(jobId);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to accept job');
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const completeJob = createAsyncThunk(
  'jobs/completeJob',
  async ({ jobId, completionData }: { jobId: string; completionData: { actualCost: number; notes?: string } }, { rejectWithValue }) => {
    try {
      const response = await apiService.completeJob(jobId, completionData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to complete job');
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAvailableJobs = createAsyncThunk(
  'jobs/fetchAvailableJobs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getAvailableJobs();
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch available jobs');
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMyJobs = createAsyncThunk(
  'jobs/fetchMyJobs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getMyJobs();
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch my jobs');
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const rateJob = createAsyncThunk(
  'jobs/rateJob',
  async ({ jobId, rating }: { jobId: string; rating: { stars: number; review?: string } }, { rejectWithValue }) => {
    try {
      const response = await apiService.rateJob(jobId, rating);
      if (response.success) {
        return { jobId, rating };
      } else {
        return rejectWithValue(response.message || 'Failed to rate job');
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState: JobState = {
  jobs: [],
  currentJob: null,
  isLoading: false,
  error: null,
  filters: {},
};

const jobSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentJob: (state, action: PayloadAction<Job | null>) => {
      state.currentJob = action.payload;
    },
    setFilters: (state, action: PayloadAction<{ status?: string; category?: string; priority?: string }>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    updateJobInList: (state, action: PayloadAction<Job>) => {
      const index = state.jobs.findIndex(job => job.id === action.payload.id);
      if (index !== -1) {
        state.jobs[index] = action.payload;
      }
      if (state.currentJob?.id === action.payload.id) {
        state.currentJob = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Jobs
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = action.payload;
        state.error = null;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Job By ID
      .addCase(fetchJobById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentJob = action.payload;
        state.error = null;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create Job
      .addCase(createJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs.unshift(action.payload);
        state.error = null;
      })
      .addCase(createJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update Job
      .addCase(updateJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.jobs.findIndex(job => job.id === action.payload.id);
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
        if (state.currentJob?.id === action.payload.id) {
          state.currentJob = action.payload;
        }
        state.error = null;
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete Job
      .addCase(deleteJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = state.jobs.filter(job => job.id !== action.payload);
        if (state.currentJob?.id === action.payload) {
          state.currentJob = null;
        }
        state.error = null;
      })
      .addCase(deleteJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Accept Job
      .addCase(acceptJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptJob.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.jobs.findIndex(job => job.id === action.payload.id);
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
        if (state.currentJob?.id === action.payload.id) {
          state.currentJob = action.payload;
        }
        state.error = null;
      })
      .addCase(acceptJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Complete Job
      .addCase(completeJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeJob.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.jobs.findIndex(job => job.id === action.payload.id);
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
        if (state.currentJob?.id === action.payload.id) {
          state.currentJob = action.payload;
        }
        state.error = null;
      })
      .addCase(completeJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Available Jobs
      .addCase(fetchAvailableJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = action.payload;
        state.error = null;
      })
      .addCase(fetchAvailableJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch My Jobs
      .addCase(fetchMyJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = action.payload;
        state.error = null;
      })
      .addCase(fetchMyJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Rate Job
      .addCase(rateJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rateJob.fulfilled, (state, action) => {
        state.isLoading = false;
        const { jobId, rating } = action.payload;
        const job = state.jobs.find(j => j.id === jobId);
        if (job) {
          job.customerRating = rating.stars;
          job.customerReview = rating.review;
        }
        if (state.currentJob?.id === jobId) {
          state.currentJob.customerRating = rating.stars;
          state.currentJob.customerReview = rating.review;
        }
        state.error = null;
      })
      .addCase(rateJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  setCurrentJob, 
  setFilters, 
  clearFilters, 
  updateJobInList 
} = jobSlice.actions;

export default jobSlice.reducer; 