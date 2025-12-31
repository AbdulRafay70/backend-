"""
Custom exception handlers for better error messages
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler for more user-friendly error messages
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        custom_response_data = {}
        
        # Handle validation errors
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
                # Process field-specific errors
                for field, errors in exc.detail.items():
                    if isinstance(errors, list):
                        # Make error messages more user-friendly
                        friendly_errors = []
                        for error in errors:
                            error_str = str(error)
                            
                            # Replace technical errors with friendly messages
                            if 'Invalid pk' in error_str and 'object does not exist' in error_str:
                                friendly_errors.append(f"Please select a valid {field}")
                            elif 'This field may not be null' in error_str:
                                friendly_errors.append(f"{field.replace('_', ' ').title()} is required")
                            elif 'This field is required' in error_str:
                                friendly_errors.append(f"{field.replace('_', ' ').title()} is required")
                            elif 'Time has wrong format' in error_str:
                                friendly_errors.append(f"Please enter time in format HH:MM (e.g., 14:30)")
                            elif 'Date has wrong format' in error_str:
                                friendly_errors.append(f"Please enter date in format YYYY-MM-DD (e.g., 2024-12-25)")
                            else:
                                friendly_errors.append(error_str)
                        
                        custom_response_data[field] = friendly_errors
                    else:
                        custom_response_data[field] = [str(errors)]
            elif isinstance(exc.detail, list):
                custom_response_data['errors'] = [str(e) for e in exc.detail]
            else:
                custom_response_data['message'] = str(exc.detail)
        
        response.data = custom_response_data
    
    return response


def format_validation_errors(errors):
    """
    Format validation errors to be more user-friendly
    """
    formatted = {}
    
    for field, error_list in errors.items():
        if isinstance(error_list, list):
            formatted[field] = []
            for error in error_list:
                error_str = str(error)
                
                # Make errors more friendly
                if 'Invalid pk' in error_str:
                    formatted[field].append(f"Please select a valid {field}")
                elif 'required' in error_str.lower():
                    formatted[field].append(f"{field.replace('_', ' ').title()} is required")
                elif 'wrong format' in error_str.lower():
                    if 'time' in error_str.lower():
                        formatted[field].append("Please enter time in format HH:MM (e.g., 14:30)")
                    elif 'date' in error_str.lower():
                        formatted[field].append("Please enter date in format YYYY-MM-DD (e.g., 2024-12-25)")
                    else:
                        formatted[field].append(error_str)
                else:
                    formatted[field].append(error_str)
        else:
            formatted[field] = str(error_list)
    
    return formatted
