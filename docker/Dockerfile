FROM debian:latest

RUN apt-get update && \
	apt-get -y install nodejs && \
	apt-get -y install npm --no-install-recommends

RUN npm install -g node-gyp

RUN apt-get -y install git

ENV TARGET_FOLDER_NAME="eco-workspace"
RUN git clone https://github.com/PharmaLedger-IMI/eco-workspace.git $TARGET_FOLDER_NAME

RUN cd $TARGET_FOLDER_NAME && \
    npm install --unsafe-perm

RUN cd $TARGET_FOLDER_NAME && \
    echo 'npm run server & \n sleep 1m \n npm run build-all \n tail -f /dev/null' >> startup-script.sh
RUN cd $TARGET_FOLDER_NAME && cat startup-script.sh

EXPOSE 8080/tcp

CMD cd $TARGET_FOLDER_NAME && \
    bash startup-script.sh
