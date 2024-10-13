export const environment = {
    is_production: false,
    port: 3000,
    projects: [
        {
            domainMapping: [
                {
                    from: "example.com",
                    to: "localhost"
                }
            ],
            path: "/mnt/volume1/websites/example.com.crystalproj"
        }
    ]
};
