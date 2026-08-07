// | Status Code                   | Meaning                                     | When to Use                                  |
// | ----------------------------- | ------------------------------------------- | -------------------------------------------- |
// | **200 OK**                    | Success                                     | Request worked                               |
// | **201 Created**               | Resource created                            | POST created something                       |
// | **400 Bad Request**           | Client sent invalid data                    | Missing fields, invalid ID, bad JSON         |
// | **401 Unauthorized**          | Client is **not authenticated**             | User is not logged in                        |
// | **403 Forbidden**             | Client is authenticated but **not allowed** | User tries to access someone else's resource |
// | **404 Not Found**             | Resource doesn't exist                      | Task or user not found                       |
// | **500 Internal Server Error** | Server error                                | Bug in your code                             |
