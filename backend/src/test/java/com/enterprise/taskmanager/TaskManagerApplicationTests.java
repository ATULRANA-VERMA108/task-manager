package com.enterprise.taskmanager;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@AutoConfigureMockMvc
class TaskManagerApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void contextLoads() {
	}

	@Test
	void testGetAllTasks() throws Exception {
		mockMvc.perform(get("/api/tasks"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isArray());
	}

	@Test
	void testGetSummaryStats() throws Exception {
		mockMvc.perform(get("/api/analytics/summary"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalTasks").exists())
				.andExpect(jsonPath("$.completed").exists());
	}

	@Test
	void testGetSettings() throws Exception {
		mockMvc.perform(get("/api/settings"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isArray());
	}
}
