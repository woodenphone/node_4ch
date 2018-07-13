import re
import os


ddl_path = os.path.join('..', 'create_db.sql')
with open(ddl_path, 'rb') as in_f:
    ddl_data = in_f.read()

#print(ddl_data)

# INSERT INTO table field1 field2 VALUES (?, ?)
query_string = ''

query_string += 'INSERT INTO '
query_string += 'posts ('

lines = ddl_data.split('\n')

start_line = 1# Skip "CREATE TABLE..."
for counter in xrange(start_line, len(lines)):
    line = lines[counter]
    print(line)
    field_name_search = re.search('^\s+"(.+)"', line)
    if field_name_search:
        field_name = field_name_search.group(1)
        query_string += '{0}, '.format(field_name)


query_string = query_string[:-2]# Chop off ', '
query_string += ') VALUES ('
query_string += ' ?,'*counter
query_string = query_string[:-1]# Chop off ','
query_string += ')'

print(query_string)