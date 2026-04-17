# nginx:alpine e' multi-arch (amd64 + arm64) — funziona su Raspberry Pi 5 senza modifiche
FROM nginx:alpine

# Rimuove la configurazione di default
RUN rm /etc/nginx/conf.d/default.conf

# Copia la configurazione personalizzata
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia l'applicazione (solo index.html, ma teniamo la struttura app/ per coerenza)
COPY app/ /usr/share/nginx/html/

EXPOSE 80
