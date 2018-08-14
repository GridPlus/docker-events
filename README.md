# Docker Events
This package exposes the docker events stream as a node event emitter. This allows you to react to the goings on in your docker engine using node!

## Example Usage
```javascript
import dee from '@gridplus/docker-events';

dee.on('health_status: unhealthy', async (data) => {
    const { Actor: { Attributes: { name } } } = data;

    log.info(`container ${name} changed health_status to unhealthy`);
)};

dee.on('die', async (data) => {

    log.error(`Oh the humanity!`);
  });

```

## Dependencies
 - Docker CLI
 - Script Shell Utility
 
As this module calls out to the command line to feed in docker events, these two dependencies are required to be in the environment where this module is called. 

## Data Schema
The data coming from the event emitter is the full JSON formatted docker event. According to the docker engine API reference it looks like the below. The field that the emitter matches on is the 'Action' field.
```json
{
  "Type": "container",
  "Action": "create",
  "Actor": {
    "ID": "ede54ee1afda366ab42f824e8a5ffd195155d853ceaec74a927f249ea270c743",
    "Attributes": {
      "com.example.some-label": "some-label-value",
      "image": "alpine",
      "name": "my-container"
    }
  },
  "time": 1461943101
}
```

Full reference at this link:
https://docs.docker.com/engine/api/v1.37/#operation/SystemEvents

Docker refers to this schema as an 'open' schema, meaning that additional fields may be added in future versions. As well, fields may vary depending on the event Type, for example container events have different fields than volume events.
One more gotcha is that some events will append additional information to the Action type after a ':' .
For example, 'health_status: unhealthy', and 'health_status: healthy' are distinct Actions. As well, the 'exec_create' action will include the exec'd command after a colon, as in ```exec_create: 'echo dockerismyonetruelove'```
