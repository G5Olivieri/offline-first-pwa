import { config } from "@/config/env";
import { useAuthStore } from "@/stores/auth-store";

export const sync = (local: PouchDB.Database) => {
  if (config.enableSync && config.couchdbUrl) {
    const name = local.name;
    local
      .sync(`${config.couchdbUrl}/${name}`, {
        live: true,
        retry: true,
      })
      .on("active", () => {
        console.log(`${name} DB replication started successfully.`);
      })
      .on("change", (change) => {
        console.log(`${name} DB replication change:`, change);
      })
      .on("complete", (info) => {
        console.log(`${name} DB replication completed:`, info);
      })
      .on("denied", (err) => {
        console.error(`${name} DB replication denied:`, err);
      })
      .on("error", (err) => {
        console.error(`${name} DB replication error:`, err);
        // TODO: remove store dependency
        const authStore = useAuthStore();
        authStore.handleUnauthorized();
      })
      .on("paused", () => {
        console.log(`${name} DB replication paused.`);
      });
  }
};
