package com.jts.BpmnJava.exception;

import com.jts.BpmnJava.BpmnJavaApplication;
import org.springframework.boot.SpringApplication;

public class FileNotFound  extends RuntimeException {
    public static void main(String[] args)
    {
        SpringApplication.run(BpmnJavaApplication.class, args);
    }
}
