(function () {
    /**
     * Classification Quiz
     * @param data
     */
    const processData = (data) => {
        data.map((item) => {
            let counter = 0;
            item.isMultipleChoice = false;
            item.answers.map((answer) => {
                answer.is_correct == 1 && counter++;
                if (counter === 2) {
                    item.isMultipleChoice = true;
                }
            });
        });
    };

    const getHandler = ($scope) => {
        const update = () => {
            sessionStorage.setItem("doing", JSON.stringify($scope.questions));
            $scope.complete = $scope.questions.reduce((value, item) => (item.done ? ++value : value), 0);
        };

        return {
            next: () => {
                if (++$scope.doing == $scope.questions.length) {
                    $scope.doing = 0;
                }

                update();
            },

            prev: () => {
                if (--$scope.doing == -1) {
                    $scope.doing = $scope.questions.length - 1;
                }

                update();
            },

            goto: ($index) => {
                $scope.doing = $index;

                update();
            },

            note: () => {
                let question = $scope.questions[$scope.doing];
                question.note = !question.note;
                console.log(question);

                update();
            },

            select: ($index, id) => {
                const isMultipleChoice = $scope.questions[$index].isMultipleChoice;
                let answers = $scope.questions[$index].answers;

                answers.map((item) => item.id == id && (item.selected = !item.selected));

                if (!isMultipleChoice) {
                    answers.map((item) => item.id != id && (item.selected = false));
                }

                if (answers.some((item) => item.selected)) $scope.questions[$index].done = true;
                else $scope.questions[$index].done = false;
                console.log($scope.questions[$index]);

                update();
            },
        };
    };

    const initCountDown = ($interval, $scope) => {
        return () => {
            let idTimeOut = $interval(() => {
                if (!--$scope.counter) {
                    $interval.cancel(idTimeOut);
                } else {
                    var minutes = Math.floor($scope.counter / 60);
                    var seconds = $scope.counter - minutes * 60;
                    $scope.remaining = ("0" + minutes).slice(-2) + ":" + ("0" + seconds).slice(-2);
                }
            }, 1000);
            $scope.doing = 0;
        };
    };

    angular.module("choosing-app").controller("doingController", [
        "$scope",
        "$rootScope",
        "$routeParams",
        "$http",
        "$interval",
        "submissionQuiz",
        ($scope, $rootScope, $routeParams, $http, $interval, submissionQuiz) => {
            $rootScope.isLoading = true;
            $scope.code = $routeParams.code.toUpperCase();
            $scope.complete = 0;
            let code = $scope.code;

            submissionQuiz.submitQuiz();

            // Get quiz by CODE
            $http
                .get($rootScope.apiUrl + "/quiz/", { params: { code } })
                .then(({ data }) => {
                    $scope.quiz = data;
                    $scope.counter = data.duration;
                    // Get question by QuizID

                    $http
                        .get($rootScope.apiUrl + "/questions/", { params: { id: data.id } })
                        .then(({ data }) => {
                            processData(data);
                            $scope.questions = data;
                        })
                        .catch((error) => {
                            // Handel the error
                        })
                        .finally(() => {
                            $rootScope.isLoading = false;
                        });

                    $scope.handelStart = initCountDown($interval, $scope);
                })
                .catch((error) => console.log(error))
                .finally(() => {
                    $scope.handler = getHandler($scope);
                    console.log($scope);
                });
        },
    ]);
})();
