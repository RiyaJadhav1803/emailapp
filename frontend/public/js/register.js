function validateForm() {
    console.log("Hello");
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    if (password !== confirmPassword ) {
        alert("Passwords do not match. Please try again.");
        return false;
    } else {
        return true;
    }
}
