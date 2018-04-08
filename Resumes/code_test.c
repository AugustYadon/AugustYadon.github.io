#include <stdio.h>
#include <stdbool.h>

int CountNumWordsInString(const char* InString)
{
	bool prev_was_letter = false;
	int wordcount = 0;
	for(int i = 0; InString[i] != '\0'; i++) 
	{
		if(InString[i] == ' ')//char is space
		{
			prev_was_letter = false;
		}
		else if(prev_was_letter)//char is letter, but last was also letter
		{
			prev_was_letter = true;
		}
		else//char is first letter of word
		{
			wordcount++;
			prev_was_letter = true;
		}
	}
	return wordcount;

}
 	
//printfs are included in the main function to make it easily visible that the function works.
//The function itself uses no string functions. 
//It treats strings as character arrays and counts how many times a letter occurs without the previous char being a letter also.
int main()
{
	char* teststring = "HELLO  WORLD"; 
    printf("\'%s\' has  %i words.\n", teststring, CountNumWordsInString(teststring));
    teststring = "HEL LO WORL D"; 
    printf("\'%s\' has  %i words.\n", teststring, CountNumWordsInString(teststring));
    teststring = "HELLO WO  RLD"; 
    printf("\'%s\' has  %i words.\n", teststring, CountNumWordsInString(teststring));
    teststring = "HELLO  WORLD"; 
    printf("\'%s\' has  %i words.\n", teststring, CountNumWordsInString(teststring));
    teststring = " HELLO WOR LD "; 
    printf("\'%s\' has  %i words.\n", teststring, CountNumWordsInString(teststring));

    teststring = "A BIG DOG"; 
    printf("\'%s\' has  %i words.\n", teststring, CountNumWordsInString(teststring));
    teststring = "A"; 
    printf("\'%s\' has  %i words.\n", teststring, CountNumWordsInString(teststring));
    teststring = " BC "; 
    printf("\'%s\' has  %i words.\n", teststring, CountNumWordsInString(teststring));
   	return 0;
}


