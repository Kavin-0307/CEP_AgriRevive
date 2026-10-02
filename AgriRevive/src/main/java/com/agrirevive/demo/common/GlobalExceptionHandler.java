package com.agrirevive.demo.common;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
	@ExceptionHandler(BusinessRuleException.class)
	public ResponseEntity<ApiError> handleBusinessRule(BusinessRuleException ex,HttpServletRequest req){
		return buildError(HttpStatus.BAD_REQUEST,ex.getMessage(),req.getRequestURI(),null);
	}
	 @ExceptionHandler(MethodArgumentNotValidException.class)
	    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
	        Map<String,String> errors=new HashMap<>();
	        for (FieldError fieldError:ex.getBindingResult().getFieldErrors()) {
	            errors.put(fieldError.getField(),fieldError.getDefaultMessage());
	        }
	        return buildError(HttpStatus.BAD_REQUEST,"Validation failed",req.getRequestURI(),errors);
	    }
	private ResponseEntity<ApiError> buildError(HttpStatus status,String msg,String path,Map<String,String> fields){
		ApiError error=new ApiError(LocalDateTime.now(),status.value(),status.getReasonPhrase(),msg,path,fields);
		return new ResponseEntity<>(error,status);
	}
}
