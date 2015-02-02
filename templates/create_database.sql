CREATE DATABASE <%- name %>
CREATE USER '<%- name %>'@'localhost' IDENTIFIED BY '<%- password %>'; 
GRANT ALL PRIVILEGES ON <%- name %>.* To '<%- name %>'@'localhost' IDENTIFIED BY '<%- password %>'; 
FLUSH PRIVILEGES;