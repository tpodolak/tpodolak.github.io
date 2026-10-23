---
title: "Definiowanie własnego operatora rzutowania"
published: 2012-02-26T21:54:00.000Z
categories: 
  - "c"
  - "explict"
tags: 
  - "c"
  - "cast"
---

Witam Ostatnio modyfikując mój kod stanąłem przed problemem rzutowania obiektu typu MembershipUser(z namespaca System.Web.Security) na mój własny typ UserDTO. Klasa UserDTO nie wyróżnia się niczym specjalnym i wygląda następująco

```
public class UserDTO : UserBase
{
    public string Id { get; set; }

    public string Email { get; set; }

    public string DisplayName { get; set; }
}

```

Podejściem dość oczywistym w takim przypadku jest utworzenie odpowiedniego konstruktora w klasie UserDTO, przyjmującego jako parametr obiekt typu MembershipUser. Jednakże można również utworzyć własny operator rzutowania, dzięki któremu zapis

```
 
MembershipUser user = new MembershipUser(/*jakies parametry*/);
UserDTO dtoUser = (UserDTO) user;

```

będzie poprawny. Wszystko sprowadza się do użycia dwóch słów kluczowych:

- operator
- explicit

W klasie UserDTO musimy dopisać następujący kod

```
public static explicit operator UserDTO(MembershipUser user)
{
    if (user == null)
        throw new ApplicationException("Parametr user nie może być null-em");

    return new UserDTO {   
                          Id = user.ProviderUserKey is Guid ? ((Guid)user.ProviderUserKey).ToString() : user.ProviderUserKey.ToString(),
                          Name = user.UserName,
                          Email = user.Email,
                       };
}

```

Jak widać tworzymy nowy operator konwersji, w którym po prawej stronie wyrażenia musi stać obiekt typu MembershipUser. Od teraz za każdym razem gdy będziemy chcieli rzutować obiekt MembershipUser na UserDTO będziemy mogli posłużyć się następującą konstrukcją.

```
 UserDTO dtoUser = (UserDTO) membershipUser;
```

\> Rzutowanie z UserDTO na MembershipUser nie jest dozwolone (przy wykorzystaniu wyżej wymienionego kodu), ale nic nie stoi na przeszkodzie aby zdefiniować drugi operator rzutowania

```
public static explicit operator MembershipUser(UserDTO userDto)
{
    //tutaj odpowiedni kod
}

```

który zapewni nam konwersję odwrotną
