import requests, json, datetime
url='https://api.saer.pk/api/hotels/'
payload={
 'name':'FrontendRuntimeTest',
 'address':'addr',
 'organization':32,
 'city':22,
 'contact_number':'+923001234567',
 'category':'ECO',
 'distance':0,
 'is_active':True,
 'available_start_date': str(datetime.date.today()),
 'available_end_date': str(datetime.date.today()+datetime.timedelta(days=1)),
 'prices':[{'start_date':str(datetime.date.today()),'end_date':str(datetime.date.today()+datetime.timedelta(days=1)),'room_type':'single','price':100}],
 'contact_details':[{'contact_person':'Reception','contact_number':'+923001234567'}]
}
print('Posting to', url)
try:
    r = requests.post(url, json=payload)
    print('Status', r.status_code)
    try:
        print('JSON:', json.dumps(r.json(), indent=2))
    except Exception as e:
        print('Text:', r.text)
except Exception as e:
    print('Request failed:', e)
