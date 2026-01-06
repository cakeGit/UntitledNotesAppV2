import notebookDatabaseRoutes from "./routes/notebookDatabaseRoutes.mjs";
import authDatabaseRoutes from "./routes/authDatabaseRoutes.mjs";
import userDatabaseRoutes from "./routes/userDatabaseRoutes.mjs";

export function addAllDatabaseRoutes(addEndpoint) {
    userDatabaseRoutes(addEndpoint);
    authDatabaseRoutes(addEndpoint);
    notebookDatabaseRoutes(addEndpoint);
}
