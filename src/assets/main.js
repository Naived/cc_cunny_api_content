        // Function to toggle the drawer
        function toggleDrawer() {
            const drawer = document.getElementById('drawer');
            drawer.classList.toggle('-translate-x-full');
        }

        // Function to close the drawer when a menu item is clicked
        function closeDrawerOnMenuClick() {
            const drawer = document.getElementById('drawer');
            drawer.classList.add('-translate-x-full');
        }

        function toggleDrawer() {
            const drawer = document.getElementById('drawer');
            drawer.classList.toggle('-translate-x-full');
        }

        function closeDrawerOnMenuClick() {
            const drawer = document.getElementById('drawer');
            drawer.classList.add('-translate-x-full');
        }

        function scrollToWithOffset(id) {
            const element = document.querySelector(id);
            const headerOffset = document.querySelector('header').offsetHeight;
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }