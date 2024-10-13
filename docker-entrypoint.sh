
# Create a self-signed cert if one doesn't exist at the cert path
cert=./cert

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

if ! test -f $cert.crt; then
    gen=yes
    printf "${RED}No certificate found. Generating certificate...${NC}\n"
fi

if openssl x509 -checkend 86400 -noout -in "$cert.crt"; then 
    gen=yes
    printf "${RED}Certificate found but is expired. Generating certificate...${NC}\n"
fi

if [ $gen = "yes" ]; then
    # Get the FQDN and the ip addresses to add to the cert
    hostname=$(hostname --fqdn)
    addresses=$(hostname -I)

    # Generate a self signed cert and attach all of the provided altnames
    openssl req -newkey \
        rsa:4096 \
        -x509 \
        -sha512 \
        -days 365 \
        -nodes \
        -out \
        $cert.crt \
        -keyout \
        $cert.key \
        -subj "/C=US/ST=OH/L=Toledo/O=DotGlitch/OU=NodeCrystalServer/CN=$hostname" \
        -addext "subjectAltName=DNS:$addresses"
else
    printf "${BLUE}Valid certificate found.${NC}\n"
fi

printf "${BLUE}Starting ${GREEN}nginx ${BLUE}...${NC}\n"
nginx "-g daemon off;"

printf "${BLUE}Starting ${YELLOW}nodejs ${BLUE}...${NC}\n"
node server/primary.js

