FROM grafana/grafana:8.3.0

# switch to root to copy and chmod the flag
USER root
COPY flag.txt /flag.txt
RUN chmod 644 /flag.txt

# Making a dummy plugin folder so traversal path looks real
RUN mkdir -p /usr/share/grafana/public/app/plugins/panel/ctf_panel \
 && echo "Nothing interesting here..." > /usr/share/grafana/public/app/plugins/panel/ctf_panel/info.txt

# Drop privileges back to grafana (default runtime user)
USER grafana

# Enable anonymous access for easy exploration
ENV GF_AUTH_ANONYMOUS_ENABLED=true
ENV GF_AUTH_ANONYMOUS_ORG_ROLE=Admin

# Expose Grafana’s port
EXPOSE 3000

CMD ["/run.sh"]
