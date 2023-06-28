import { FirehoseTransformationEvent } from "aws-lambda";

export const metricProcessorEventMock = (): FirehoseTransformationEvent => ({
  "invocationId": "ad13cf6d-2acb-4d06-989a-458a0e55531f",
  "deliveryStreamArn": "arn:aws:firehose:eu-central-1:254825746541:deliverystream/saas-metrics-analytics-delivery-stream",
  "region": "eu-central-1",
  "records": [
    {
      "recordId": "49641521451332716515402258731240496149091766504597225474000000",
      "approximateArrivalTimestamp": 1686223085806,
      "data": "eyJ0ZW5hbnQiOnsiaWQiOiJkNTc2NTZkNi1iZDhlLTRkNmUtOGViYy00Y2UzOGYwYmIyYzQiLCJuYW1lIjoiQ2FzcGVyIC0gTW9uYWhhbiIsInRpZXIiOiJzdGFuZGFyZCIsImNyZWF0ZWRBdCI6IjIwMjMtMDYtMDhUMTA6NTc6NTAuOTY2WiJ9LCJtZXRyaWMiOnsiaWQiOiJmNmZlMTkxNS1lNGVjLTQ0ODYtYjZmNC1kYjk1ZmUxMmJmYTIiLCJuYW1lIjoiUE9TVCIsInZhbHVlIjowLjEyLCJ0eXBlIjoiY291bnQiLCJ1bml0IjoiJSIsImNhdGVnb3J5Ijoic2FsZXMifSwidHlwZSI6ImFwcGxpY2F0aW9uIiwibWV0YWRhdGEiOnsic2VydmljZSI6Im9ibG9uZy1pbnF1aXJ5LmNvbSIsImRvbWFpbiI6InRyaWNreS1uZXJ2ZS5vcmciLCJyb3V0ZSI6Imh0dHBzOi8vc2FsdHktcHJlbWl1bS5iaXoiLCJyZXF1ZXN0SWQiOiI0ZWU4OWQ5My03OTE5LTRlOTMtYjAyNy1kYzFiNTgxOTI1NjIifSwiY3JlYXRlZEF0IjoiMjAyMy0wNi0wOFQxMToxODowNS42NzdaIn0="
    }
  ]
});