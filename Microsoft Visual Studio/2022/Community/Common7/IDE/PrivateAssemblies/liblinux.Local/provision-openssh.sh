#!/usr/bin/env bash

# Store the input.
NEW_USER=$1
ALREADY_PROVISIONED_EXITCODE=$2

# Log all commands in the output.
set -x

# Check for the file that marks the WSL instance as provisioned by Visual Studio.
ALREADY_PROVISIONED_FILE="/home/$NEW_USER/.vs/openssh_provisioned_$NEW_USER"
if [ -f $ALREADY_PROVISIONED_FILE ]; then
   echo "WSL instance already provisioned as the file '$ALREADY_PROVISIONED_FILE' exists."
   # Ensure ssh is started without stopping it.
   /etc/init.d/ssh start || exit 1
   exit $ALREADY_PROVISIONED_EXITCODE
fi

# Add user and keys, the private key in pem format.
useradd -d /home/$NEW_USER -m -s/bin/bash $NEW_USER || echo $?
mkdir -p /home/$NEW_USER/.ssh || echo $?
cat /dev/zero | ssh-keygen -t rsa -b 2048 -q -N "" -f /home/$NEW_USER/.ssh/$NEW_USER -m pem || echo $?
cat /home/$NEW_USER/.ssh/$NEW_USER.pub >> /home/$NEW_USER/.ssh/authorized_keys && chmod 600 /home/$NEW_USER/.ssh/authorized_keys || echo $?
chown -R $NEW_USER:$NEW_USER /home/$NEW_USER || echo $?
mkdir -p /mnt/c/Users/$NEW_USER/.ssh || echo $?
cp /home/$NEW_USER/.ssh/$NEW_USER /mnt/c/Users/$NEW_USER/.ssh/$NEW_USER || echo $?

# Generate the ssh hostkeys
ssh-keygen -A || echo $?

# Start the openssh-server
# /usr/sbin/sshd -D
/etc/init.d/ssh stop
/etc/init.d/ssh start || exit 1

# Create the file that marks the WSL instance as provisioned by Visual Studio.
mkdir -p $(dirname $ALREADY_PROVISIONED_FILE) && touch $ALREADY_PROVISIONED_FILE || echo $?
chown -R $NEW_USER:$NEW_USER $(dirname $ALREADY_PROVISIONED_FILE) || echo $?

# Success!
exit 0
