FROM node:20-alpine as build

# Install node
RUN apk add nodejs npm

WORKDIR /tmp
COPY . .

RUN npm i
RUN npm run build
RUN npm i --omit=dev



FROM nginx:stable-alpine3.20
ENV NODE_ENV production

RUN apk add nodejs openssl

# Pull in nginx configuration
COPY ./nginx.conf /etc/nginx/nginx.conf
RUN rm /etc/nginx/conf.d/default.conf

# Test the nginx configuration
# RUN nginx -t -c /etc/nginx/nginx.conf

WORKDIR /app

COPY --from=build /tmp/dist /app/
COPY --from=build /tmp/package.json /app/package.json
COPY --from=build /tmp/node_modules /app/node_modules
COPY --from=build /tmp/docker-entrypoint.sh /app/docker-entrypoint.sh

RUN chown -R 101:101 "/app"
RUN mkdir /var/cache/nginx/.npm
RUN chown -R 101:101 "/var/cache/nginx/.npm"
RUN chmod 1777 /tmp -R
USER 101

RUN mkdir /tmp/nginx

EXPOSE 8080

CMD ["/bin/sh", "docker-entrypoint.sh"]