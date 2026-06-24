FROM nginx:alpine
# Copy all static assets into nginx public folder
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY user-dashboard /usr/share/nginx/html/user-dashboard
COPY task-board /usr/share/nginx/html/task-board
COPY admin-panel /usr/share/nginx/html/admin-panel
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
