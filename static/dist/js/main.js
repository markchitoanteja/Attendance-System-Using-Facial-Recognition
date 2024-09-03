jQuery(document).ready(function () {
    var is_camera_started = false;

    if (notification) {
        let notif = notification.split("|");

        Swal.fire({
            title: notif[0],
            text: notif[1],
            icon: notif[2]
        })
    }

    $('[data-mask]').inputmask();

    $("#example").DataTable({
        "paging": true,
        "lengthChange": false,
        "ordering": false
    })

    $(".logout").click(function () {
        $.ajax({
            url: '/logout',
            type: 'POST',
            dataType: 'JSON',
            processData: false,
            contentType: false,
            success: function (response) {
                if (response) {
                    location.href = "/";
                }
            },
            error: function (_, _, error) {
                console.error(error);
            }
        });
    })

    $("#mode").click(function () {
        let new_mode = "light";

        if (mode && mode == "dark") {
            new_mode = "light";
        } else {
            new_mode = "dark";
        }

        var formData = new FormData();

        formData.append('mode', new_mode);

        $.ajax({
            url: '/change_mode',
            data: formData,
            type: 'POST',
            dataType: 'JSON',
            processData: false,
            contentType: false,
            success: function (response) {
                if (response) {
                    location.reload();
                }
            },
            error: function (_, _, error) {
                console.error(error);
            }
        });
    })

    $("#account_settings_image").change(function (event) {
        var displayImage = $('#account_settings_image_display');
        var file = event.target.files[0];
        var imageURL = URL.createObjectURL(file);

        displayImage.attr('src', imageURL);

        displayImage.on('load', function () {
            URL.revokeObjectURL(imageURL);
        });
    })

    $("#account_settings").click(function () {
        $(".loading").removeClass("d-none");
        $("#account_settings_modal").modal("show");

        var formData = new FormData();

        formData.append('user_id', user_id);

        $.ajax({
            url: '/get_admin_data',
            data: formData,
            type: 'POST',
            dataType: 'JSON',
            processData: false,
            contentType: false,
            success: function (response) {
                if (response) {
                    $("#account_settings_name").val(response["name"]);
                    $("#account_settings_username").val(response["username"]);
                    $("#account_settings_image_display").attr("src", "static/dist/img/uploads/admin/" + response["image"])
                    $("#account_settings_old_password").val(response["password"]);
                    $("#account_settings_old_image").val(response["image"]);

                    $(".loading").addClass("d-none");
                }
            },
            error: function (_, _, error) {
                console.error(error);
            }
        });
    })

    $("#account_settings_form").submit(function () {
        const name = $("#account_settings_name").val();
        const username = $("#account_settings_username").val();
        let password = $("#account_settings_password").val();
        const confirm_password = $("#account_settings_confirm_password").val();
        const old_password = $("#account_settings_old_password").val();
        const image_input = $("#account_settings_image")[0];
        let image = $("#account_settings_old_image").val();

        let errors = 0;

        if (image_input.files.length > 0) {
            var image_file = image_input.files[0];

            image = image_file.name;
        }

        if (password != confirm_password) {
            $("#account_settings_password").addClass("is-invalid");
            $("#account_settings_confirm_password").addClass("is-invalid");
            $("#error_account_settings_password").removeClass("d-none");

            errors++;
        }

        if (!errors) {
            $("#account_settings_submit").text("Please wait...");
            $("#account_settings_submit").attr("disabled", true);
            $(".loading").removeClass("d-none");

            let is_new_password = true;

            if (!password) {
                password = old_password;

                is_new_password = false;
            }

            var formData = new FormData();

            formData.append('user_id', user_id);
            formData.append('name', name);
            formData.append('username', username);
            formData.append('password', password);
            formData.append('is_new_password', is_new_password);
            formData.append('image', image);
            formData.append('image_file', image_file);

            $.ajax({
                url: '/update_admin',
                data: formData,
                type: 'POST',
                dataType: 'JSON',
                processData: false,
                contentType: false,
                success: function (response) {
                    if (response) {
                        setTimeout(function () {
                            location.reload();
                        }, 1500);
                    }
                },
                error: function (_, _, error) {
                    console.error(error);
                }
            });
        }
    })

    $("#account_settings_password").keydown(function () {
        $("#account_settings_password").removeClass("is-invalid");
        $("#account_settings_confirm_password").removeClass("is-invalid");
        $("#error_account_settings_password").addClass("d-none");
    })

    $("#account_settings_confirm_password").keydown(function () {
        $("#account_settings_password").removeClass("is-invalid");
        $("#account_settings_confirm_password").removeClass("is-invalid");
        $("#error_account_settings_password").addClass("d-none");
    })

    $("#new_student").click(function () {
        $("#new_student_modal").modal("show");
    })

    $("#camera_start_stop").click(function () {
        if (!is_camera_started) {
            Webcam.set({
                height: 250,
                image_format: "jpeg",
                jpeg_quality: 90
            });

            Webcam.attach("#camera_preview");

            $(this).text("Stop Camera");
            $(this).removeClass("btn-primary");
            $(this).addClass("btn-danger");

            $("#capture_image").removeAttr("disabled");

            is_camera_started = true;
        } else {
            Webcam.reset();

            $('#camera_preview').html('');

            $(this).text("Start Camera");
            $(this).removeClass("btn-danger");
            $(this).addClass("btn-primary");

            $("#capture_image").attr("disabled", true);
            $("#capture_image").text("Capture");

            is_camera_started = false;
        }
    })

    $("#capture_image").click(function () {
        Webcam.snap(function (data_uri) {
            $("#captured_image_preview").attr("src", data_uri);
            $("#new_student_image").val(data_uri);

            $("#new_student_image").removeClass("is-invalid");
            $("#error_new_student_image").addClass("d-none");

            $("#capture_image").text("Re-Capture");
        });
    })

    $("#new_student_form").submit(function () {
        const student_number = $("#new_student_student_number").val();
        const course = $("#new_student_course").val();
        const year = $("#new_student_year").val();
        const section = $("#new_student_section").val();
        const first_name = $("#new_student_first_name").val();
        const middle_name = $("#new_student_middle_name").val();
        const last_name = $("#new_student_last_name").val();
        const date_of_birth = $("#new_student_date_of_birth").val();
        const gender = $("#new_student_gender").val();
        const nationality = $("#new_student_nationality").val();
        const mobile_number = $("#new_student_mobile_number").val().replace(/\D/g, '');
        const email_address = $("#new_student_email_address").val();
        const address = $("#new_student_address").val();
        const image = $("#new_student_image").val();

        let errors = 0;

        if (!image) {
            $("#new_student_image").addClass("is-invalid");
            $("#error_new_student_image").removeClass("d-none");

            $("#new_student_image").focus();

            errors++;
        }

        if (mobile_number.length != 11) {
            $("#new_student_mobile_number").addClass("is-invalid");
            $("#error_new_student_mobile_number").removeClass("d-none");

            $("#new_student_mobile_number").focus();

            errors++;
        }

        if (!errors) {
            $("#new_student_submit").text("Please wait...");
            $("#new_student_submit").attr("disabled", true);

            $(".loading").removeClass("d-none");

            var formData = new FormData();

            formData.append('student_number', student_number);
            formData.append('course', course);
            formData.append('year', year);
            formData.append('section', section);
            formData.append('first_name', first_name);
            formData.append('middle_name', middle_name);
            formData.append('last_name', last_name);
            formData.append('date_of_birth', date_of_birth);
            formData.append('gender', gender);
            formData.append('nationality', nationality);
            formData.append('mobile_number', mobile_number);
            formData.append('email_address', email_address);
            formData.append('address', address);
            formData.append('image', image);

            $.ajax({
                url: '/save_student',
                data: formData,
                type: 'POST',
                dataType: 'JSON',
                processData: false,
                contentType: false,
                success: function (response) {
                    setTimeout(function () {
                        if (response) {
                            location.reload();
                        } else {
                            $("#new_student_submit").text("Submit");
                            $("#new_student_submit").removeAttr("disabled");

                            $(".loading").addClass("d-none");

                            $("#new_student_student_number").addClass("is-invalid");
                            $("#error_new_student_student_number").removeClass("d-none");
                            $("#new_student_student_number").focus();
                        }
                    }, 1500);
                },
                error: function (_, _, error) {
                    console.error(error);
                }
            });
        }
    })

    $("#new_student_mobile_number").keydown(function () {
        $("#new_student_mobile_number").removeClass("is-invalid");
        $("#error_new_student_mobile_number").addClass("d-none");
    })

    $("#new_student_student_number").keydown(function () {
        $("#new_student_student_number").removeClass("is-invalid");
        $("#error_new_student_student_number").addClass("d-none");
    })

    $(document).on("click", ".edit_student", function () {
        const student_id = $(this).attr("student_id");

        $("#update_student_modal").modal("show");
        $(".loading").removeClass("d-none");

        var formData = new FormData();

        formData.append('student_id', student_id);

        $.ajax({
            url: '/get_student_data',
            data: formData,
            type: 'POST',
            dataType: 'JSON',
            processData: false,
            contentType: false,
            success: function (response) {
                $("#update_student_id").val(student_id);
                $("#update_student_student_number").val(response["student_number"]);
                $("#update_student_course").val(response["course"]);
                $("#update_student_year").val(response["year"]);
                $("#update_student_section").val(response["section"]);
                $("#update_student_first_name").val(response["first_name"]);
                $("#update_student_middle_name").val(response["middle_name"]);
                $("#update_student_last_name").val(response["last_name"]);
                $("#update_student_date_of_birth").val(response["date_of_birth"]);
                $("#update_student_gender").val(response["gender"]);
                $("#update_student_nationality").val(response["nationality"]);
                $("#update_student_mobile_number").val(response["mobile_number"]);
                $("#update_student_email_address").val(response["email_address"]);
                $("#update_student_address").val(response["address"]);
                $("#update_student_image").val(response["image"]);
                $("#update_captured_image_preview").attr("src", "static/dist/img/uploads/users/" + response["image"]);
                $("#update_student_old_student_number").val(response["student_number"]);
                $("#update_student_old_image").val(response["image"]);

                $(".loading").addClass("d-none");
            },
            error: function (_, _, error) {
                console.error(error);
            }
        });
    })

    $("#update_camera_start_stop").click(function () {
        if (!is_camera_started) {
            Webcam.set({
                height: 250,
                image_format: "jpeg",
                jpeg_quality: 90
            });

            Webcam.attach("#update_camera_preview");

            $(this).text("Stop Camera");
            $(this).removeClass("btn-primary");
            $(this).addClass("btn-danger");

            $("#update_capture_image").removeAttr("disabled");

            is_camera_started = true;
        } else {
            Webcam.reset();

            $('#update_camera_preview').html('');

            $(this).text("Start Camera");
            $(this).removeClass("btn-danger");
            $(this).addClass("btn-primary");

            $("#update_capture_image").attr("disabled", true);
            $("#update_capture_image").text("Capture");

            is_camera_started = false;
        }
    })

    $("#update_capture_image").click(function () {
        Webcam.snap(function (data_uri) {
            $("#update_captured_image_preview").attr("src", data_uri);
            $("#update_student_image").val(data_uri);

            $("#update_student_image").removeClass("is-invalid");
            $("#error_update_student_image").addClass("d-none");

            $("#update_capture_image").text("Re-Capture");
        });
    })

    $("#update_student_form").submit(function () {
        const student_number = $("#update_student_student_number").val();
        const course = $("#update_student_course").val();
        const year = $("#update_student_year").val();
        const section = $("#update_student_section").val();
        const first_name = $("#update_student_first_name").val();
        const middle_name = $("#update_student_middle_name").val();
        const last_name = $("#update_student_last_name").val();
        const date_of_birth = $("#update_student_date_of_birth").val();
        const gender = $("#update_student_gender").val();
        const nationality = $("#update_student_nationality").val();
        const mobile_number = $("#update_student_mobile_number").val().replace(/\D/g, '');
        const email_address = $("#update_student_email_address").val();
        const address = $("#update_student_address").val();
        const image = $("#update_student_image").val();
        const old_student_number = $("#update_student_old_student_number").val();
        const old_image = $("#update_student_old_image").val();
        const id = $("#update_student_id").val();

        let errors = 0;

        if (!image) {
            $("#update_student_image").addClass("is-invalid");
            $("#error_update_student_image").removeClass("d-none");

            $("#update_student_image").focus();

            errors++;
        }

        if (mobile_number.length != 11) {
            $("#update_student_mobile_number").addClass("is-invalid");
            $("#error_update_student_mobile_number").removeClass("d-none");

            $("#update_student_mobile_number").focus();

            errors++;
        }

        if (!errors) {
            $("#update_student_submit").text("Please wait...");
            $("#update_student_submit").attr("disabled", true);

            $(".loading").removeClass("d-none");

            var formData = new FormData();

            formData.append('id', id);
            formData.append('student_number', student_number);
            formData.append('course', course);
            formData.append('year', year);
            formData.append('section', section);
            formData.append('first_name', first_name);
            formData.append('middle_name', middle_name);
            formData.append('last_name', last_name);
            formData.append('date_of_birth', date_of_birth);
            formData.append('gender', gender);
            formData.append('nationality', nationality);
            formData.append('mobile_number', mobile_number);
            formData.append('email_address', email_address);
            formData.append('address', address);
            formData.append('image', image);
            formData.append('old_student_number', old_student_number);
            formData.append('old_image', old_image);

            $.ajax({
                url: '/update_student',
                data: formData,
                type: 'POST',
                dataType: 'JSON',
                processData: false,
                contentType: false,
                success: function (response) {
                    setTimeout(function () {
                        if (response) {
                            location.reload();
                        } else {
                            $("#update_student_submit").text("Submit");
                            $("#update_student_submit").removeAttr("disabled");

                            $(".loading").addClass("d-none");

                            $("#update_student_student_number").addClass("is-invalid");
                            $("#error_update_student_student_number").removeClass("d-none");
                            $("#update_student_student_number").focus();
                        }
                    }, 1500);
                },
                error: function (_, _, error) {
                    console.error(error);
                }
            });
        }
    })

    $("#update_student_mobile_number").keydown(function () {
        $("#update_student_mobile_number").removeClass("is-invalid");
        $("#error_update_student_mobile_number").addClass("d-none");
    })

    $("#update_student_student_number").keydown(function () {
        $("#update_student_student_number").removeClass("is-invalid");
        $("#error_update_student_student_number").addClass("d-none");
    })

    $(document).on("click", ".delete_student", function () {
        const student_id = $(this).attr("student_id");

        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            if (result.isConfirmed) {
                var formData = new FormData();

                formData.append('id', student_id);

                $.ajax({
                    url: '/delete_student',
                    data: formData,
                    type: 'POST',
                    dataType: 'JSON',
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        if (response) {
                            location.reload();
                        }
                    },
                    error: function (_, _, error) {
                        console.error(error);
                    }
                });
            }
        });
    })

    $("#new_attendance").click(function () {
        $(".loading").addClass("d-none");
        $("#new_attendance_modal").modal("show");
    })

    $("#new_attendance_start_stop_camera").click(function () {
        if (!is_camera_started) {
            Webcam.set({
                height: 250,
                image_format: 'jpeg',
                jpeg_quality: 90
            });

            Webcam.attach('#new_attendance_camera');

            is_camera_started = true;

            $(this).text("Stop Camera");
            $(this).removeClass("btn-primary");
            $(this).addClass("btn-danger");

            $("#new_attendance_capture").removeAttr("disabled");
            $("#new_attendance_capture").text("Capture");

            is_camera_started = true;
        } else {
            Webcam.reset();

            $(this).text("Start Camera");
            $(this).removeClass("btn-danger");
            $(this).addClass("btn-primary");

            $("#new_attendance_capture").attr("disabled", true);

            is_camera_started = false;
        }
    })

    $("#new_attendance_capture").click(function () {
        Webcam.snap(function (data_uri) {
            $("#new_attendance_image_preview").attr("src", data_uri);
            $("#new_attendance_image").val(data_uri);

            $("#actual_results").addClass("d-none");
            $("#new_attendance_result").removeClass("d-none");
            $("#waiting_message").removeClass("d-none");
            $("#waiting_result").removeClass("d-none");
            $("#waiting_message").text("Selecting match from the database...");
            $("#waiting_message").addClass("text-muted");
            $("#waiting_message").removeClass("text-danger");
            $("#new_attendance_confirm").addClass("d-none");
            $("#new_attendance_capture").text("Re-Capture");

            $("#btn_cancel").focus();

            var formData = new FormData();

            formData.append('image', data_uri);

            $.ajax({
                url: '/match_face',
                data: formData,
                type: 'POST',
                dataType: 'JSON',
                processData: false,
                contentType: false,
                success: function (response) {
                    if (response) {
                        let student_id = response.split("_")[0];

                        var formData = new FormData();

                        formData.append('student_id', student_id);

                        $.ajax({
                            url: '/get_student_data',
                            data: formData,
                            type: 'POST',
                            dataType: 'JSON',
                            processData: false,
                            contentType: false,
                            success: function (response) {
                                let firstName = response["first_name"];
                                let middleName = response["middle_name"];
                                let lastName = response["last_name"];
                                let middleInitial = middleName ? middleName.charAt(0) + ". " : "";

                                $("#new_attendance_student_number").val(response["student_number"]);
                                $("#new_attendance_full_name").val(firstName + " " + middleInitial + lastName);
                                $("#new_attendance_course_year_section").val(response["course"] + " " + response["year"][0] + "-" + response["section"]);

                                $("#new_attendance_student_image").val(response["image"]);

                                $("#new_attendance_random_image").attr("src", "static/dist/img/uploads/users/" + response["image"]);
                                $("#waiting_result").addClass("d-none");
                                $("#actual_results").removeClass("d-none");
                                $("#new_attendance_confirm").removeClass("d-none");
                                $("#new_attendance_confirm").focus();
                            },
                            error: function (_, _, error) {
                                console.error(error);
                            }
                        });
                    } else {
                        $("#waiting_message").text("No registered face detected.");
                        $("#waiting_message").removeClass("text-muted");
                        $("#waiting_message").addClass("text-danger");
                    }
                },
                error: function (_, _, error) {
                    console.error(error);
                }
            });
        });
    })

    $("#new_attendance_modal").on("hidden.bs.modal", function () {
        Webcam.reset();

        $("#new_attendance_start_stop_camera").text("Start Camera");
        $("#new_attendance_start_stop_camera").removeClass("btn-danger");
        $("#new_attendance_start_stop_camera").addClass("btn-primary");

        $("#new_attendance_capture").attr("disabled", true);
        $("#new_attendance_capture").text("Capture");
        $("#new_attendance_result").addClass("d-none");

        $("#new_attendance_image").val("");
        $("#new_attendance_image_preview").attr("src", "static/dist/img/white-background.png");

        is_camera_started = false;
    })

    $("#new_attendance_form").submit(function () {
        const student_number = $("#new_attendance_student_number").val();
        const full_name = $("#new_attendance_full_name").val();
        const course_year_section = $("#new_attendance_course_year_section").val();
        const student_image = $("#new_attendance_student_image").val();

        $("#new_attendance_confirm").text("Please wait...");
        $(".loading").removeClass("d-none");

        var formData = new FormData();

        formData.append('student_number', student_number);
        formData.append('student_name', full_name);
        formData.append('course_year_section', course_year_section);
        formData.append('image', student_image);

        $.ajax({
            url: '/new_attendance',
            data: formData,
            type: 'POST',
            dataType: 'JSON',
            processData: false,
            contentType: false,
            success: function (response) {
                if (response) {
                    location.reload();
                }
            },
            error: function (_, _, error) {
                console.error(error);
            }
        });
    })
})