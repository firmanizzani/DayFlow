package com.dayflow.task;

import java.util.UUID;

public record SubtaskCount(UUID taskId, Long total, Long completed) {}
