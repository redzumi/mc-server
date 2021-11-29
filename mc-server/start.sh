running=1

finish()
{
    running=0
}

trap finish SIGINT

while (( running )); do
    java -Xms6G -Xmx7G -jar forge-1.16.5-36.2.19.jar nogui
    echo "Restarting server on crash.."
    sleep 5
done
